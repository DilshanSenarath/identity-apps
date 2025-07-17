/**
 * Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com).
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

import { IdentifiableComponentInterface } from "@wso2is/core/models";
import { CopyInputField } from "@wso2is/react-components";
import React from "react";
import { Button, Message, Modal } from "semantic-ui-react";

/**
 * Props for the AgentSecretShowModal component.
 */
interface AgentSecretShowModalProps extends IdentifiableComponentInterface {
    /**
     * The title to be displayed in the modal.
     */
    title: string;
    /**
     * The unique identifier of the agent.
     */
    agentId: string;
    /**
     * The secret associated with the agent.
     */
    agentSecret: string;
    /**
     * Flag indicating whether the modal is open.
     */
    isOpen: boolean;
    /**
     * Callback to be invoked when the modal is closed.
     */
    onClose: () => void;
}

export function AgentSecretShowModal({
    title,
    agentId,
    agentSecret,
    isOpen,
    onClose,
    ["data-componentid"]: componentId = "agent-secret-show-modal"
}: AgentSecretShowModalProps) {

    return (
        <Modal
            data-testid={ componentId }
            data-componentid={ componentId }
            open={ isOpen }
            className="wizard"
            dimmer="blurring"
            size="tiny"
            onClose={ onClose }
            closeOnDimmerClick={ false }
            closeOnEscape
        >
            <Modal.Header>{ title }</Modal.Header>
            <Modal.Content>
                <Message warning>
                    <strong>Important:</strong> Please copy and store the agent credentials securely.{ " " }
                    Make sure to copy the agent secret now as you will not be able to see this again.
                </Message>

                <label>Agent ID</label>
                <div style={ { marginTop: "1%" } }>
                    <CopyInputField
                        className="agent-id-input"
                        value={ agentId }
                        data-componentid="agent-id-readonly-input"
                    />
                </div>
                <div style={ { marginTop: "2%" } }></div>
                <label>Agent secret</label>
                <div style={ { marginTop: "1%" } }>
                    <CopyInputField
                        className="agent-secret-input"
                        secret
                        value={ agentSecret }
                        hideSecretLabel={ "Hide secret" }
                        showSecretLabel={ "Show secret" }
                        data-componentid={ "agent-secret-readonly-input" }
                    />
                </div>
            </Modal.Content>

            <Modal.Actions>
                <Button
                    primary={ true }
                    type="submit"
                    onClick={ () => {
                        onClose();
                    }
                    }
                    data-testid={ `${componentId}-confirmation-modal-actions-continue-button` }
                >
                            Done
                </Button>
            </Modal.Actions>
        </Modal>
    );
}
