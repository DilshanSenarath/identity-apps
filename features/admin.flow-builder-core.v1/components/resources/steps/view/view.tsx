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

import Box from "@oxygen-ui/react/Box";
import FormGroup from "@oxygen-ui/react/FormGroup";
import IconButton from "@oxygen-ui/react/IconButton";
import Paper from "@oxygen-ui/react/Paper";
import Tooltip from "@oxygen-ui/react/Tooltip";
import Typography from "@oxygen-ui/react/Typography";
import { XMarkIcon } from "@oxygen-ui/react-icons";
import { IdentifiableComponentInterface } from "@wso2is/core/models";
import { Handle, Node, Position, useNodeId, useNodesData, useReactFlow } from "@xyflow/react";
import classNames from "classnames";
import React, { FunctionComponent, MouseEvent, ReactElement, useEffect } from "react";
import ReorderableElement from "./reorderable-element";
import VisualFlowConstants from "../../../../constants/visual-flow-constants";
import { Element } from "../../../../models/elements";
import Droppable from "../../../dnd/droppable";
import "./view.scss";
import { CollisionPriority } from "@dnd-kit/abstract";

/**
 * Props interface of {@link View}
 */
export interface ViewPropsInterface extends Node, IdentifiableComponentInterface {}

/**
 * Node for representing an empty view as a step in the flow builder.
 *
 * @param props - Props injected to the component.
 * @returns Step Node component.
 */
export const View: FunctionComponent<ViewPropsInterface> = ({
    data,
    "data-componentid": componentId = "view"
}: ViewPropsInterface): ReactElement => {
    const stepId: string = useNodeId();
    const node: Pick<Node, "data"> = useNodesData(stepId);
    const { deleteElements, updateNodeData } = useReactFlow();

    useEffect(() => {
        if ((data?.components as Element[])?.length <= 0) {
            return;
        }

        updateNodeData(stepId, () => {
            return {
                components: data?.components
            };
        });
    }, []);

    return (
        <div className="flow-builder-step" data-componentid={ componentId }>
            <Box display="flex" justifyContent="space-between" className="flow-builder-step-action-panel">
                <Typography
                    variant="body2"
                    data-componentid={ `${componentId}-heading-text` }
                    className="flow-builder-step-id"
                >
                    View
                </Typography>
                <Tooltip title={ "Remove" }>
                    <IconButton
                        size="small"
                        onClick={ (_: MouseEvent<HTMLButtonElement>) => {
                            deleteElements({ nodes: [ { id: stepId } ] });
                        } }
                        className="flow-builder-step-remove-button"
                    >
                        <XMarkIcon />
                    </IconButton>
                </Tooltip>
            </Box>
            <Handle type="target" position={ Position.Left } />
            <Box className="flow-builder-step-content" data-componentid={ `${componentId}-inner` }>
                <Paper className="flow-builder-step-content-box" elevation={ 0 } variant="outlined">
                    <Box className="flow-builder-step-content-form">
                        <FormGroup>
                            <Droppable
                                id={ VisualFlowConstants.FLOW_BUILDER_VIEW_ID }
                                data={ { stepId } }
                                sx={ { padding: "40px 32px" } }
                                type={ VisualFlowConstants.FLOW_BUILDER_DROPPABLE_VIEW_ID }
                                accept={ [
                                    VisualFlowConstants.FLOW_BUILDER_DRAGGABLE_ID,
                                    ...VisualFlowConstants.FLOW_BUILDER_VIEW_ALLOWED_RESOURCE_TYPES
                                ] }
                                collisionPriority={ CollisionPriority.Low }
                            >
                                { (node?.data?.components as any).map((component: Element, index: number) => (
                                    <ReorderableElement
                                        key={ component.id }
                                        id={ component.id }
                                        index={ index }
                                        element={ component }
                                        className={ classNames("flow-builder-step-content-form-field") }
                                        type={ VisualFlowConstants.FLOW_BUILDER_DRAGGABLE_ID }
                                        accept={ [ VisualFlowConstants.FLOW_BUILDER_DRAGGABLE_ID ] }
                                        group={ stepId }
                                    />
                                )) }
                            </Droppable>
                        </FormGroup>
                    </Box>
                </Paper>
            </Box>
        </div>
    );
};

export default View;
