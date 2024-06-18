/**
 * Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { AppState } from "@wso2is/admin.core.v1";
import { AlertLevels, IdentifiableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import {
    ContentLoader,
    EmphasizedSegment,
    Markdown
} from "@wso2is/react-components";
import get from "lodash-es/get";
import React, { FunctionComponent, ReactElement, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Dispatch } from "redux";
import { useGetApplication } from "../../api/use-get-application";
import useGetApplicationInboundConfigs from "../../api/use-get-application-inbound-configs";
import { SAMLApplicationConfigurationInterface, SupportedAuthProtocolTypes } from "../../models";

/**
 * Prop types of the `MarkdownGuide` component.
 */
export interface MarkdownGuidePropsInterface extends IdentifiableComponentInterface {
    /**
     * Id of the current application.
     */
    applicationId: string;
    /**
     * Content to be displayed in Markdown format.
     */
    content: string;
    /**
     * Is the application info request loading.
     */
    isLoading?: boolean;
}

/**
 * Markdown guide generation component.
 *
 * @param Props - Props to be injected into the component.
 */
export const MarkdownGuide: FunctionComponent<MarkdownGuidePropsInterface> = (
    props: MarkdownGuidePropsInterface
): ReactElement => {
    const {
        applicationId,
        content,
        isLoading,
        ["data-componentid"]: componentId
    } = props;

    const { t } = useTranslation();

    const dispatch: Dispatch = useDispatch();

    const {
        data: application,
        isLoading: applicationLoading,
        error: applicationFetchRequestError
    } = useGetApplication(applicationId, !!applicationId);
    const {
        data: applicationInboundProtocol,
        isLoading: applicationInboundProtocolLoading,
        error: applicationInboundProtocolFetchRequestError
    } = useGetApplicationInboundConfigs(applicationId, SupportedAuthProtocolTypes.SAML, !!applicationId);
    const samlConfigurations: SAMLApplicationConfigurationInterface = useSelector(
        (state: AppState) => state.application.samlConfigurations);

    /**
     * Handles the application get request error.
     */
    useEffect(() => {
        if (!applicationFetchRequestError) {
            return;
        }

        if (applicationFetchRequestError.response?.data?.description) {
            dispatch(addAlert({
                description: applicationFetchRequestError.response.data.description,
                level: AlertLevels.ERROR,
                message: t("applications:notifications.fetchApplication.error.message")
            }));

            return;
        }

        dispatch(addAlert({
            description: t("applications:notifications.fetchApplication" +
                ".genericError.description"),
            level: AlertLevels.ERROR,
            message: t("applications:notifications.fetchApplication.genericError." +
                "message")
        }));
    }, [ applicationFetchRequestError ]);

    /**
     * Handle errors that occur during the application inbound protocol data fetch request.
     */
    useEffect(() => {
        if (!applicationInboundProtocolFetchRequestError) {
            return;
        }

        if (applicationInboundProtocolFetchRequestError?.response?.data?.description) {
            dispatch(addAlert({
                description: applicationInboundProtocolFetchRequestError.response.data.description,
                level: AlertLevels.ERROR,
                message: t("applications:notifications.getInboundProtocolConfig.error.message")
            }));

            return;
        }

        dispatch(addAlert({
            description: t("applications:notifications.getInboundProtocolConfig" +
                ".genericError.description"),
            level: AlertLevels.ERROR,
            message: t("applications:notifications.getInboundProtocolConfig" +
                ".genericError.message")
        }));
    }, [ applicationInboundProtocolFetchRequestError ]);

    const moderatedContent: string = useMemo(() => {
        return content.replace(/\${([^}]+?)}/g, (match: string, key: string) => {
            let propertyValue: unknown = get(application, key);

            if (!propertyValue) {
                propertyValue = get(applicationInboundProtocol, key);
            }

            if (!propertyValue) {
                propertyValue = get(samlConfigurations, key);
            }

            if (propertyValue && typeof propertyValue === "string") {
                return propertyValue;
            }

            return match;
        });
    }, [ content ]);

    return (
        <EmphasizedSegment data-componentid={ componentId } padded="very">
            {
                isLoading || applicationLoading || applicationInboundProtocolLoading
                    ? <ContentLoader inline="centered" active/>
                    : (
                        <Markdown
                            source={ moderatedContent }
                        />
                    )
            }
        </EmphasizedSegment>
    );
};

/**
 * Default props for the `MarkdownGuide` guide.
 */
MarkdownGuide.defaultProps = {
    "data-componentid": "markdown-guide"
};
