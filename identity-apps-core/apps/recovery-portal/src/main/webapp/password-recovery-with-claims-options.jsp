<%--
  ~ Copyright (c) 2020-2025, WSO2 LLC. (https://www.wso2.com).
  ~
  ~ WSO2 LLC. licenses this file to you under the Apache License,
  ~ Version 2.0 (the "License"); you may not use this file except
  ~ in compliance with the License.
  ~ You may obtain a copy of the License at
  ~
  ~    http://www.apache.org/licenses/LICENSE-2.0
  ~
  ~ Unless required by applicable law or agreed to in writing,
  ~ software distributed under the License is distributed on an
  ~ "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  ~ KIND, either express or implied.  See the License for the
  ~ specific language governing permissions and limitations
  ~ under the License.
--%>

<%@ page contentType="text/html;charset=UTF-8" language="java" %>

<%@ page import="org.apache.commons.collections.map.HashedMap" %>
<%@ page import="org.apache.commons.lang.StringUtils" %>
<%@ page import="org.owasp.encoder.Encode" %>
<%@ page import="org.wso2.carbon.identity.mgt.endpoint.util.IdentityManagementEndpointUtil" %>
<%@ page import="org.wso2.carbon.identity.mgt.endpoint.util.client.ApiException" %>
<%@ page import="java.util.ArrayList" %>
<%@ page import="java.util.List" %>
<%@ page import="java.util.Map" %>
<%@ page import="org.wso2.carbon.identity.mgt.endpoint.util.client.api.RecoveryApiV2" %>
<%@ page import="org.wso2.carbon.identity.mgt.endpoint.util.client.model.recovery.v2.*" %>
<%@ page import="org.wso2.carbon.identity.mgt.endpoint.util.client.api.UsernameRecoveryApi" %>
<%@ page import="org.wso2.carbon.identity.mgt.endpoint.util.client.model.*" %>
<%@ page import="org.wso2.carbon.identity.mgt.endpoint.util.client.PreferenceRetrievalClient" %>
<%@ page import="org.wso2.carbon.identity.mgt.endpoint.util.client.PreferenceRetrievalClientException" %>
<%@ page import="org.wso2.carbon.identity.mgt.endpoint.util.IdentityManagementEndpointConstants" %>
<%@ page import="java.net.URISyntaxException" %>
<%@ page import="java.io.File" %>
<%@ taglib prefix="layout" uri="org.wso2.identity.apps.taglibs.layout.controller" %>

<%-- Localization --%>
<jsp:directive.include file="includes/localize.jsp"/>

<%-- Include tenant context --%>
<jsp:directive.include file="tenant-resolve.jsp"/>

<%-- Branding Preferences --%>
<jsp:directive.include file="includes/branding-preferences.jsp"/>

<%
    String username = IdentityManagementEndpointUtil.getStringValue(request.getParameter("username"));
    String callback = IdentityManagementEndpointUtil.getStringValue(request.getParameter("callback"));
    String sessionDataKey = IdentityManagementEndpointUtil.getStringValue(request.getParameter("sessionDataKey"));

    String recaptchaResponse = request.getParameter("g-recaptcha-response");
    if (StringUtils.isBlank(callback)) {
        callback = IdentityManagementEndpointUtil.getUserPortalUrl(
                application.getInitParameter(IdentityManagementEndpointConstants.ConfigConstants.USER_PORTAL_URL), tenantDomain);
    }

    boolean isNotificationBasedRecoveryEnabled = false;
    boolean isChallengeQuestionsEnabled = false;

    boolean isEmailEnabled = false;
    Boolean isEmailOtpBasedPasswordRecoveryEnabledByTenant = false;
    boolean isSMSOTPEnabled = false;
    String recoveryCode = "";
    String emailId = "";
    String smsOtpId = "";
    String screenValue = "";

    try {
        PreferenceRetrievalClient preferenceRetrievalClient = new PreferenceRetrievalClient();
        isEmailOtpBasedPasswordRecoveryEnabledByTenant =
            preferenceRetrievalClient.checkEmailOTPBasedPasswordRecovery(tenantDomain);
    } catch (PreferenceRetrievalClientException e) {
        request.setAttribute("error", true);
        request.setAttribute("errorMsg", IdentityManagementEndpointUtil
                        .i18n(recoveryResourceBundle, "something.went.wrong.contact.admin"));
        IdentityManagementEndpointUtil.addErrorInformation(request, e);
        if (!StringUtils.isBlank(username)) {
            request.setAttribute("username", username);
        }
        request.getRequestDispatcher("error.jsp").forward(request, response);
        return;
    }

    List<Claim> claims;
    UsernameRecoveryApi usernameRecoveryApi = new UsernameRecoveryApi();
    try {
        claims = usernameRecoveryApi.getClaimsForUsernameRecovery(tenantDomain, true);
    } catch (ApiException e) {
        IdentityManagementEndpointUtil.addErrorInformation(request, e);
        request.setAttribute("username", username);
        request.getRequestDispatcher("error.jsp").forward(request, response);
        return;
    }

    List<UserClaim> claimDTOList = new ArrayList<UserClaim>();

    if (StringUtils.isNotBlank(username)) {
        UserClaim userClaim = new UserClaim();
        userClaim.setUri("http://wso2.org/claims/username");
        userClaim.setValue(username);
        claimDTOList.add(userClaim);
    }

    for (Claim claimDTO : claims) {
        if (StringUtils.isNotBlank(request.getParameter(claimDTO.getUri()))) {
            UserClaim userClaim = new UserClaim();
            userClaim.setUri(claimDTO.getUri());
            userClaim.setValue(request.getParameter(claimDTO.getUri()).trim());
            claimDTOList.add(userClaim);
        }
    }

    RecoveryInitRequest recoveryInitRequest = new RecoveryInitRequest();
    recoveryInitRequest.setClaims(claimDTOList);
    RecoveryApiV2 recoveryApiV2 = new RecoveryApiV2();
    try {
        Map<String, String> requestHeaders = new HashedMap();
        if (recaptchaResponse != null) {
            requestHeaders.put("g-recaptcha-response", recaptchaResponse);
        }
        List<AccountRecoveryType> accountRecoveryTypes = recoveryApiV2.
                initiatePasswordRecovery(recoveryInitRequest, tenantDomain, requestHeaders);
        if (accountRecoveryTypes == null) {
            request.setAttribute("callback", callback);
            request.setAttribute("username", username);
            request.getRequestDispatcher("password-recovery-with-claims-notify.jsp").forward(request,
                        response);
            return;
        }
        IdentityManagementEndpointUtil.addReCaptchaHeaders(request, recoveryApiV2.getApiClient().getResponseHeaders());
        for (AccountRecoveryType accountRecoveryType : accountRecoveryTypes) {
            if (accountRecoveryType.getMode().equals("recoverWithNotifications")) {
                isNotificationBasedRecoveryEnabled = true;
                RecoveryChannelInformation channelInfo = accountRecoveryType.getChannelInfo();
                recoveryCode = channelInfo.getRecoveryCode();
                List<RecoveryChannel> channels = channelInfo.getChannels();
                for (RecoveryChannel channel : channels) {
                    if (channel.getType().equals("EMAIL")) {
                        isEmailEnabled = true;
                        emailId = channel.getId();
                    } else if (channel.getType().equals("SMS")) {
                        isSMSOTPEnabled = true;
                        smsOtpId = channel.getId();
                        screenValue = channel.getValue();
                    }
                    else if (channel.getType().equals("EXTERNAL")) {
                        isNotificationBasedRecoveryEnabled = false;
                    }
                }
            } else if (accountRecoveryType.getMode().equals("recoverWithChallengeQuestions")) {
                isChallengeQuestionsEnabled = true;
                List<APICall> apiCallsList = accountRecoveryType.getLinks();
                for (APICall apiCall : apiCallsList) {
                    if (apiCall.getRel().equals("next")) {
                        String href = apiCall.getHref();
                        try {
                            username = IdentityManagementEndpointUtil.getQueryParameter(href,"username");
                        } catch (URISyntaxException e) {
                            request.setAttribute("error", true);
                            request.setAttribute("errorMsg", IdentityManagementEndpointUtil.i18n(recoveryResourceBundle,
                                    "Cannot.obtain.username.from.server.response"));
                            request.setAttribute("username", username);
                            request.getRequestDispatcher("error.jsp").forward(request, response);
                            return;
                        }
                    }
                }
            }
        }
    } catch (ApiException e) {
        request.setAttribute("tenantDomain", tenantDomain);
        if (e.getCode() == 404) {
            request.setAttribute("error", true);
            request.setAttribute("errorMsg", IdentityManagementEndpointUtil.i18n(recoveryResourceBundle,
                    "No.valid.user.found"));
            request.getRequestDispatcher("recoveraccountrouter.do").forward(request, response);
            return;
        }
        if (e.getCode() == 409) {
            request.setAttribute("error", true);
            request.setAttribute("errorMsg", IdentityManagementEndpointUtil.i18n(recoveryResourceBundle,
                    "Insufficient.info.to.find.user"));
            request.getRequestDispatcher("recoveraccountrouter.do").forward(request, response);
            return;
        }
        IdentityManagementEndpointUtil.addErrorInformation(request, e);
        request.setAttribute("username", username);
        request.getRequestDispatcher("error.jsp").forward(request, response);
        return;
    }

    if (!isNotificationBasedRecoveryEnabled && !isChallengeQuestionsEnabled) {
        request.setAttribute("error", true);
        request.setAttribute("errorMsg", IdentityManagementEndpointUtil.i18n(recoveryResourceBundle,
                "No.recovery.options.found"));
        request.setAttribute("username", username);
        request.getRequestDispatcher("error.jsp").forward(request, response);
        return;
    }
%>

<% request.setAttribute("pageName", "password-recovery-with-claims-options"); %>

<!doctype html>
<html lang="en-US">
<head>
    <%
        File headerFile = new File(getServletContext().getRealPath("extensions/header.jsp"));
        if (headerFile.exists()) {
    %>
    <jsp:include page="extensions/header.jsp"/>
    <% } else { %>
    <jsp:include page="includes/header.jsp"/>
    <% } %>
</head>
<body class="login-portal layout recovery-layout" data-page="<%= request.getAttribute("pageName") %>">
    <layout:main layoutName="<%= layout %>" layoutFileRelativePath="<%= layoutFileRelativePath %>" data="<%= layoutData %>" >
        <layout:component componentName="ProductHeader">
            <%-- product-title --%>
            <%
                File productTitleFile = new File(getServletContext().getRealPath("extensions/product-title.jsp"));
                if (productTitleFile.exists()) {
            %>
                <jsp:include page="extensions/product-title.jsp"/>
            <% } else { %>
                <jsp:include page="includes/product-title.jsp"/>
            <% } %>
        </layout:component>
        <layout:component componentName="MainSection" >
            <div class="ui segment">
                <%-- page content --%>
                <h3 class="ui header">
                    <%=IdentityManagementEndpointUtil.i18n(recoveryResourceBundle, "Recover.password")%>
                </h3>

                <div class="ui negative message" id="error-msg" hidden="hidden"></div>

                <div class="field mb-5">
                    <%=i18n(recoveryResourceBundle, customText, "password.recovery.body")%>
                </div>
                <div class="ui divider hidden"></div>
                <div class="segment-form">
                    <form class="ui large form" method="post" action="verify.do" id="recoverDetailsForm">
                        <div class="segment" style="text-align: left;">
                        <% if (isNotificationBasedRecoveryEnabled) { %>
                        <% if (isEmailEnabled) {
                            String emailSendLabel = isEmailOtpBasedPasswordRecoveryEnabledByTenant
                                                        ? "send.email.otp"
                                                        : "send.email.link";
                        %>
                            <div class="field">
                                <div class="ui radio checkbox">
                                    <input type="radio" name="recoveryOption" value="<%=emailId%>" checked/>
                                    <label><%=IdentityManagementEndpointUtil.i18n
                                            (recoveryResourceBundle, emailSendLabel)%></label>
                                </div>
                            </div>
                        <%
                            }
                            if (isSMSOTPEnabled) {
                        %>
                            <div class="field">
                                <div class="ui radio checkbox">
                                    <input type="radio" name="recoveryOption"
                                        value="<%=smsOtpId%>" />
                                    <label><%=IdentityManagementEndpointUtil.i18n
                                            (recoveryResourceBundle,"send.code.via.sms")%></label>
                                </div>
                            </div>
                            <input type="hidden" name="screenValue" value="<%=Encode.forHtmlAttribute(screenValue)%>"/>
                        <%
                            }
                        }
                            if (isChallengeQuestionsEnabled) {
                        %>
                        <div class="form-group">
                            <div class="ui radio checkbox">
                                <input type="radio" name="recoveryOption" value="SECURITY_QUESTIONS"/>
                                <label><%=IdentityManagementEndpointUtil.i18n(recoveryResourceBundle, "Recover.with.question")%>
                                </label>
                            </div>
                        </div>

                        <input type="hidden" name="username" value="<%=Encode.forHtmlAttribute(username)%>"/>
                        <input type="hidden" name="g-recaptcha-response" value="<%=Encode.forHtmlAttribute(recaptchaResponse)%>"/>
                        <%
                            }
                            if (sessionDataKey != null) {
                        %>
                        <div>
                            <input type="hidden" name="sessionDataKey"
                                value="<%=Encode.forHtmlAttribute(sessionDataKey) %>"/>
                        </div>
                        <%
                            }
                        %>
                        </div>
                        <div>
                            <input type="hidden" name="callback" value="<%=Encode.forHtmlAttribute(callback) %>"/>
                            <input type="hidden" name="tenantDomain"
                                value="<%=Encode.forHtmlAttribute(tenantDomain) %>"/>
                            <input type="hidden" name="recoveryCode" value="<%=recoveryCode %>"/>
                            <input type="hidden" name="isPasswordRecoveryWithClaimsNotify" value="true">
                            <input type="hidden" name="isEmailOtpBasedPasswordRecoveryEnabledByTenant"
                                value="<%=isEmailOtpBasedPasswordRecoveryEnabledByTenant %>"/>
                            <input type="hidden" name="recoveryStage" value="INITIATE"/>
                        </div>
                        <div class="ui divider hidden"></div>
                        <div class="align-right buttons">
                            <a href="javascript:goBack()" class="ui button secondary">
                                <%=IdentityManagementEndpointUtil.i18n(recoveryResourceBundle, "Cancel")%>
                            </a>
                            <button id="recoverySubmit"
                                    class="ui primary button"
                                    type="submit">
                                <%=IdentityManagementEndpointUtil.i18n(recoveryResourceBundle, "Submit")%>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </layout:component>
        <layout:component componentName="ProductFooter">
            <%-- product-footer --%>
            <%
                File productFooterFile = new File(getServletContext().getRealPath("extensions/product-footer.jsp"));
                if (productFooterFile.exists()) {
            %>
                <jsp:include page="extensions/product-footer.jsp"/>
            <% } else { %>
                <jsp:include page="includes/product-footer.jsp"/>
            <% } %>
        </layout:component>
        <layout:dynamicComponent filePathStoringVariableName="pathOfDynamicComponent">
            <jsp:include page="${pathOfDynamicComponent}" />
        </layout:dynamicComponent>
    </layout:main>

    <%-- footer --%>
    <%
        File footerFile = new File(getServletContext().getRealPath("extensions/footer.jsp"));
        if (footerFile.exists()) {
    %>
    <jsp:include page="extensions/footer.jsp"/>
    <% } else { %>
    <jsp:include page="includes/footer.jsp"/>
    <% } %>

    <script type="text/javascript">
        function goBack() {
            window.history.back();
        }

        $(document).ready(function () {
            $("#recoverDetailsForm").submit(function (e) {
                var errorMessage = $("#error-msg");
                errorMessage.hide();
                return true;
            });
        });
    </script>
</body>
</html>
