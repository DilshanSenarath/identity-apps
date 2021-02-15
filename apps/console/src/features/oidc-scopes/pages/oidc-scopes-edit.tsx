/**
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
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

import { getAllExternalClaims, getAllLocalClaims } from "@wso2is/core/api";
import { IdentityAppsApiException } from "@wso2is/core/exceptions";
import { AlertLevels, Claim, ExternalClaim, TestableComponentInterface } from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import { Field, FormValue, Forms, useTrigger } from "@wso2is/forms";
import { AnimatedAvatar, EmphasizedSegment, ListLayout, PageLayout, PrimaryButton } from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { RouteComponentProps } from "react-router";
import { Divider, Grid, Header, Icon, Input, Label, Placeholder } from "semantic-ui-react";
import { AppConstants, UIConstants, history } from "../../core";
import { getOIDCScopeDetails, updateOIDCScopeDetails } from "../api";
import { EditOIDCScope } from "../components";
import { OIDCScopesManagementConstants } from "../constants";
import { OIDCScopesListInterface } from "../models";

/**
 * Path params interface
 */
interface OIDCScopesEditPagePathParams {
    id: string;
}

/**
 * Proptypes for the OIDC scopes edit page component.
 */
type OIDCScopesEditPageInterface = TestableComponentInterface;

/**
 * OIDC Scopes Edit page component.
 *
 * @param {OIDCScopesEditPageInterface} props - Props injected to the component.
 *
 * @return {React.ReactElement}
 */
const OIDCScopesEditPage: FunctionComponent<RouteComponentProps<OIDCScopesEditPagePathParams> &
    OIDCScopesEditPageInterface> = (
    props: RouteComponentProps<OIDCScopesEditPagePathParams> & OIDCScopesEditPageInterface
): ReactElement => {
    const {
        ["data-testid"]: testId,
        match: {
            params: { id: scopeName }
        }
    } = props;

    const { t } = useTranslation();

    const dispatch = useDispatch();

    const [scope, setScope] = useState<OIDCScopesListInterface>({});
    const [claims, setClaims] = useState<Claim[]>([]);
    const [isScopeRequestLoading, setScopeRequestLoading] = useState<boolean>(true);
    const [listItemLimit, setListItemLimit] = useState<number>(UIConstants.DEFAULT_RESOURCE_LIST_ITEM_LIMIT);
    const [OIDCAttributes, setOIDCAttributes] = useState<ExternalClaim[]>(undefined);
    const [selectedAttributes, setSelectedAttributes] = useState<ExternalClaim[]>([]);
    const [tempSelectedAttributes, setTempSelectedAttributes] = useState<ExternalClaim[]>([]);
    const [unselectedAttributes, setUnselectedAttributes] = useState<ExternalClaim[]>([]);
    const [triggerAddAttributeModal, setTriggerAttributeModal] = useTrigger();

    useEffect(() => {
        getAllLocalClaims(null)
            .then((response) => {
                setClaims(response);
            })
            .catch((error) => {
                dispatch(
                    addAlert({
                        description:
                            error?.response?.data?.description ||
                            t("console:manage.features.claims.local.notifications.getClaims.genericError.description"),
                        level: AlertLevels.ERROR,
                        message:
                            error?.response?.data?.message ||
                            t("console:manage.features.claims.local.notifications.getClaims.genericError.message")
                    })
                );
            });
    }, []);

    useEffect(() => {
        if (OIDCAttributes) {
            return;
        }
        const OIDCAttributeId = OIDCScopesManagementConstants.OIDC_ATTRIBUTE_ID;

        if (!claims || claims.length === 0) {
            return;
        }

        getOIDCAttributes(OIDCAttributeId);
    }, [claims, OIDCAttributes]);

    useEffect(() => {
        if (OIDCAttributes == undefined) {
            return;
        }

        mapSelectedAttributes();
    }, [OIDCAttributes, scope]);

    const mapSelectedAttributes = () => {
        if (!scope.claims) {
            return;
        }

        const selected = [];
        scope?.claims?.map((claim) => {
            selected.push(OIDCAttributes.find((item) => item?.claimURI == claim));
        });

        setSelectedAttributes(selected);
        setTempSelectedAttributes(selected);
        setUnselectedAttributes(OIDCAttributes.filter((x) => !selected?.includes(x)));
    };

    /**
     * Fetch the scope details on initial component load.
     */
    useEffect(() => {
        if (!scopeName) {
            return;
        }

        const scope = scopeName;

        getScope(scope);
    }, [scopeName]);

    const getOIDCAttributes = (claimId: string) => {
        setScopeRequestLoading(true);
        getAllExternalClaims(claimId, null)
            .then((response) => {
                response?.forEach((externalClaim) => {
                    const mappedLocalClaimUri = externalClaim.mappedLocalClaimURI;
                    const matchedLocalClaim = claims.filter((localClaim) => {
                        return localClaim.claimURI === mappedLocalClaimUri;
                    });

                    if (matchedLocalClaim && matchedLocalClaim[0] && matchedLocalClaim[0].displayName) {
                        externalClaim.localClaimDisplayName = matchedLocalClaim[0].displayName;
                    }
                });
                setOIDCAttributes(response);
            })
            .catch((error) => {
                if (error.response && error.response.data && error.response.data.description) {
                    dispatch(
                        addAlert({
                            description: error.response.data.description,
                            level: AlertLevels.ERROR,
                            message: t(
                                "console:manage.features.oidcScopes.notifications.fetchOIDClaims.error" + ".message"
                            )
                        })
                    );

                    return;
                }

                dispatch(
                    addAlert({
                        description: t(
                            "console:manage.features.oidcScopes.notifications.fetchOIDClaims" +
                                ".genericError.description"
                        ),
                        level: AlertLevels.ERROR,
                        message: t(
                            "console:manage.features.oidcScopes.notifications.fetchOIDClaims" + ".genericError.message"
                        )
                    })
                );
            })
            .finally(() => {
                setScopeRequestLoading(false);
            });
    };

    const searchSelectedAttributes = (event) => {
        const changeValue = event.target.value;
        if (changeValue.length > 0) {
            setTempSelectedAttributes(
                selectedAttributes.filter(
                    (claim: ExternalClaim) => claim.claimURI.toLowerCase().indexOf(changeValue.toLowerCase()) !== -1
                )
            );
        } else {
            setTempSelectedAttributes(selectedAttributes);
        }
    };

    /**
     * Retrieves scope details from the API.
     *
     * @param scopeName - name of the scope.
     */
    const getScope = (scopeName: string): void => {
        setScopeRequestLoading(true);

        getOIDCScopeDetails(scopeName)
            .then((response: OIDCScopesListInterface) => {
                setScope(response);
            })
            .catch((error) => {
                if (error.response && error.response.data && error.response.data.description) {
                    dispatch(
                        addAlert({
                            description: error.response.data.description,
                            level: AlertLevels.ERROR,
                            message: t(
                                "console:manage.features.oidcScopes.notifications." + "fetchOIDCScope.error.message"
                            )
                        })
                    );

                    return;
                }

                dispatch(
                    addAlert({
                        description: t(
                            "console:manage.features.oidcScopes.notifications.fetchOIDCScope" +
                                ".genericError.description"
                        ),
                        level: AlertLevels.ERROR,
                        message: t(
                            "console:manage.features.oidcScopes.notifications.fetchOIDCScope.genericError." + "message"
                        )
                    })
                );
            })
            .finally(() => {
                setScopeRequestLoading(false);
            });
    };

    /**
     * Handles the back button click event.
     */
    const handleBackButtonClick = (): void => {
        history.push(AppConstants.getPaths().get("OIDC_SCOPES"));
    };

    return (
        <PageLayout
            action={
                <PrimaryButton
                    data-testid="user-mgt-roles-list-update-button"
                    size="medium"
                    icon={ <Icon name="add" /> }
                    floated="right"
                    onClick={ () => setTriggerAttributeModal() }
                >
                    <Icon name="add" />
                    { t("console:manage.features.oidcScopes.editScope." + "claimList.addClaim") }
                </PrimaryButton>
            }
            isLoading={ isScopeRequestLoading }
            title={ scope.displayName }
            contentTopMargin={ true }
            description={
                <>
                    <Label className="no-margin-left">
                        <code>{ scope.name }</code>
                    </Label>
                    { " " + (scope.description || t("console:manage.pages.oidcScopesEdit.subTitle")) }
                </>
            }
            image={ <AnimatedAvatar name={ scope.name } size="tiny" floated="left" /> }
            backButton={ {
                onClick: handleBackButtonClick,
                text: t("console:manage.pages.oidcScopesEdit.backButton")
            } }
            titleTextAlign="left"
            bottomMargin={ false }
            data-testid={ `${testId}-page-layout` }
        >
            <Header>Update Scope</Header>
            <EmphasizedSegment>
                <Grid>
                    <Grid.Row columns={ 1 }>
                        <Grid.Column width={ 6 }>
                            { !isScopeRequestLoading ? (
                                <Forms
                                    onSubmit={ (values: Map<string, FormValue>) => {
                                        updateOIDCScopeDetails(scope.name, {
                                            claims: scope.claims,
                                            description: values.get("description").toString(),
                                            displayName: values.get("displayName").toString()
                                        })
                                            .then(() => {
                                                dispatch(
                                                    addAlert({
                                                        description: t(
                                                            "console:manage.features.oidcScopes.notifications." +
                                                                "updateOIDCScope.success.description"
                                                        ),
                                                        level: AlertLevels.SUCCESS,
                                                        message: t(
                                                            "console:manage.features.oidcScopes." +
                                                                "notifications.updateOIDCScope.success.message"
                                                        )
                                                    })
                                                );
                                                getScope(scopeName);
                                            })
                                            .catch((error: IdentityAppsApiException) => {
                                                dispatch(
                                                    addAlert({
                                                        description:
                                                            error?.response?.data?.description ??
                                                            t(
                                                                "console:manage.features.oidcScopes." +
                                                                    "notifications.updateOIDCScope.genericError." +
                                                                    "description"
                                                            ),
                                                        level: AlertLevels.ERROR,
                                                        message:
                                                            error?.response?.data?.message ??
                                                            t(
                                                                "console:manage.features.oidcScopes." +
                                                                    "notifications.updateOIDCScope.genericError." +
                                                                    "message"
                                                            )
                                                    })
                                                );
                                            });
                                    } }
                                >
                                    <Field
                                        type="text"
                                        name="displayName"
                                        label={ t(
                                            "console:manage.features.oidcScopes.forms.addScopeForm." +
                                                "inputs.displayName.label"
                                        ) }
                                        placeholder={ t(
                                            "console:manage.features.oidcScopes.forms." +
                                                "addScopeForm.inputs." +
                                                "displayName.placeholder"
                                        ) }
                                        value={ scope.displayName }
                                        required={ true }
                                        requiredErrorMessage={ t(
                                            "console:manage.features.oidcScopes.forms." +
                                                "addScopeForm.inputs.displayName.validations.empty"
                                        ) }
                                    />
                                    <Field
                                        type="text"
                                        name="description"
                                        label={ t(
                                            "console:manage.features.oidcScopes.forms.addScopeForm." +
                                                "inputs.description.label"
                                        ) }
                                        placeholder={ t(
                                            "console:manage.features." +
                                                "oidcScopes.forms.addScopeForm.inputs." +
                                                "description.placeholder"
                                        ) }
                                        value={ scope.description }
                                        required={ false }
                                        requiredErrorMessage=""
                                    />
                                    <PrimaryButton type="submit">{ t("common:update") }</PrimaryButton>
                                </Forms>
                            ) : (
                                <Placeholder>
                                    <Placeholder.Line length="medium" />
                                    <Placeholder.Line length="short" />
                                </Placeholder>
                            ) }
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </EmphasizedSegment>
            <Divider hidden />
            <ListLayout
                showTopActionPanel={ isScopeRequestLoading || !(scope.claims?.length == 0) }
                listItemLimit={ listItemLimit }
                showPagination={ false }
                onPageChange={ () => null }
                totalPages={ Math.ceil(scope.claims?.length / listItemLimit) }
                data-testid={ `${testId}-list-layout` }
                leftActionPanel={
                    <div className="advanced-search-wrapper aligned-left fill-default">
                        <Input
                            className="advanced-search with-add-on"
                            data-testid={ `${testId}-list-search-input` }
                            icon="search"
                            iconPosition="left"
                            onChange={ searchSelectedAttributes }
                            placeholder={ t("console:manage.features.oidcScopes.editScope."
                                + "claimList.searchClaims") }
                            floated="right"
                            size="small"
                        />
                    </div>
                }
            >
                <EditOIDCScope
                    scope={ scope }
                    isLoading={ isScopeRequestLoading }
                    onUpdate={ getScope }
                    data-testid={ testId }
                    selectedAttributes={ tempSelectedAttributes }
                    unselectedAttributes={ unselectedAttributes }
                    isRequestLoading={ isScopeRequestLoading }
                    triggerAddAttributeModal={ triggerAddAttributeModal }
                />
            </ListLayout>
        </PageLayout>
    );
};

/**
 * Default proptypes for the application edit page component.
 */
OIDCScopesEditPage.defaultProps = {
    "data-testid": "oidc-scopes-edit"
};

/**
 * A default export was added to support React.lazy.
 * TODO: Change this to a named export once react starts supporting named exports for code splitting.
 * @see {@link https://reactjs.org/docs/code-splitting.html#reactlazy}
 */
export default OIDCScopesEditPage;
