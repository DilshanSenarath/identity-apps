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

import { MainApplicationInterface } from "../../applications/models/application";

export interface ApplicationTemplateCommonInterface {
    /**
     * Unique identifier for the template.
     */
    id: string;
    /**
     * Name of the template.
     */
    name: string;
    /**
     * Description of the template.
     */
    description: string;
    /**
     * Image of the template.
     */
    image: string;
    /**
     * Order in which the template is displayed.
     */
    displayOrder: number;
    /**
     * Category of the template.
     */
    category: ApplicationTemplateCategories;
    /**
     * Tags associated with the template.
     */
    tags: string[];
    /**
     * Type of the template.
     */
    type: string;
}

/**
 * Interface for the application template list specific attributes.
 */
export interface ApplicationTemplateListInterface extends ApplicationTemplateCommonInterface {
    /**
     * URL to the template data.
     */
    self?: string;
    /**
     * Additional properties of the template.
     */
    additionalProperties?: AdditionalPropertyInterface[];
}

/**
 * Interface for the application template.
 */
export interface ApplicationTemplateInterface extends ApplicationTemplateCommonInterface {
    /**
     * Create form payload parameters.
     */
    payload: MainApplicationInterface;
}

/**
 * Interface for the application template metadata.
 */
export interface ApplicationTemplateMetadataInterface {
    /**
     * Application creation related metadata.
     */
    create: {
        form: {
            // TODO: FIx types (Need to define proper type for this with additional attributes)
            fields: any;
        };
        /**
         * Application creation guide metadata.
         */
        guide: {
            /**
             * Application creation guide content.
             */
            content: string;
            /**
             * Application creation guide content type.
             */
            contentType: "md" | "html" | string;
        }[];
    }
}

/**
 * Interface for the additional properties of the template.
 */
export interface AdditionalPropertyInterface {
    /**
     * Key of the property.
     */
    key: string,
    /**
     * Value of the property.
     */
    value: any
}

/**
 * Enum for application template categories.
 *
 * @readonly
 */
export enum ApplicationTemplateCategories {
    /**
     * Templates supported by default.
     * ex: Web Application, SPA etc.
     */
    DEFAULT = "DEFAULT",
    /**
     * Vendor templates.
     * ex: Zoom, Salesforce etc.
     */
    VENDOR = "VENDOR",
}

/**
 * Supported technology metadata interface.
 */
export interface SupportedTechnologyMetadataInterface {
    /**
     * Display name of the technology.
     */
    displayName: string;
    /**
     * URL of the technology logo.
     */
    logo?: string;
}
