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

import { ServerConfigurationsConstants } from "./server-configurations-constants";

export class PasswordRecoveryFormConstants {

    /**
     * Private constructor to avoid object instantiation from outside the class.
     *
     */
    /* eslint-disable @typescript-eslint/no-empty-function */
    private constructor() { }

    public static readonly allowedConnectorFields: string[] = [
        ServerConfigurationsConstants.NOTIFY_SUCCESS,
        ServerConfigurationsConstants.RECOVERY_LINK_EXPIRY_TIME,
        ServerConfigurationsConstants.RECOVERY_EMAIL_LINK_ENABLE,
        ServerConfigurationsConstants.RECOVERY_EMAIL_OTP_ENABLE,
        ServerConfigurationsConstants.RECOVERY_SMS_OTP_ENABLE,
        ServerConfigurationsConstants.RECOVERY_SMS_EXPIRY_TIME,
        ServerConfigurationsConstants.RECOVERY_OTP_USE_UPPERCASE,
        ServerConfigurationsConstants.RECOVERY_OTP_USE_LOWERCASE,
        ServerConfigurationsConstants.RECOVERY_OTP_USE_NUMERIC,
        ServerConfigurationsConstants.RECOVERY_OTP_LENGTH,
        ServerConfigurationsConstants.RECOVERY_MAX_RESEND_COUNT,
        ServerConfigurationsConstants.RECOVERY_MAX_FAILED_ATTEMPTS_COUNT
    ];
}
