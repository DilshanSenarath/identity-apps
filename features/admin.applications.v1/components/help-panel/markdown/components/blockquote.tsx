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

import Alert, { AlertProps } from "@oxygen-ui/react/Alert";
import AlertTitle from "@oxygen-ui/react/AlertTitle";
import { MarkdownCustomComponentPropsInterface } from "@wso2is/react-components";
import React, { FunctionComponent, ReactElement } from "react";
import { childRenderer } from "./utils";

/**
 * Props interface for the `AlertMessage` component.
 */
interface AlertMessageProps extends MarkdownCustomComponentPropsInterface<"blockquote"> {
    /**
     * Custom attributes supplied by the 'rehype-attr' plugin.
     */
    "data-config"?: {
        /**
         * Type of the alert message.
         */
        type?: AlertProps["severity"];
        /**
         * Title of the alert message.
         */
        title?: string;
        /**
         * Variant of the alert box.
         * filled or outlined
         */
        variant?: AlertProps["variant"];
        /**
         * Boolean flag to determine if the icon should be displayed.
         */
        icon?: boolean;
    };
}

/**
 * Markdown custom component for the blockquote element.
 * This component corresponds to the 'AlertMessage' component in our Markdown.
 *
 * @param Props - Props to be injected into the component.
 */
const AlertMessage: FunctionComponent<AlertMessageProps> = (props: AlertMessageProps): ReactElement => {
    const {
        children,
        "data-config": dataConfig,
        "data-componentid": componentId
    } = props;

    if (!children || !Array.isArray(children)) {
        return null;
    }

    return (
        <Alert
            severity={ dataConfig?.type || "info" }
            icon={ dataConfig?.icon === false ? false : undefined }
            variant={ dataConfig?.variant || "standard" }
            data-componentid={ componentId }
        >
            {
                dataConfig?.title ? (
                    <AlertTitle>{ dataConfig?.title }</AlertTitle>
                ) : null
            }
            { childRenderer(props) }
        </Alert>
    );
};

/**
 * Default props for the `AlertMessage` component.
 */
AlertMessage.defaultProps = {
    "data-componentid": "custom-markdown-blockquote"
};

export { AlertMessage as blockquote };
