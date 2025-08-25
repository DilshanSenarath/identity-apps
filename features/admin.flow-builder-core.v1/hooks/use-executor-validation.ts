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

import { Edge, useReactFlow } from "@xyflow/react";
import { MutableRefObject, useEffect, useRef } from "react";
import useValidationStatus from "./use-validation-status";
import VisualFlowConstants from "../constants/visual-flow-constants";
import { ElementTypes } from "../models/elements";
import { EventTypes } from "../models/extension";
import Notification, { NotificationType } from "../models/notification";
import { Resource } from "../models/resources";
import { ExecutionTypes, StepTypes } from "../models/steps";
import PluginRegistry from "../plugins/plugin-registry";

/**
 * Custom hook to manage executor validation in execution nodes.
 */
const useExecutorValidation = (): void => {

    const { getEdges } = useReactFlow();
    const { addNotification, removeNotification } = useValidationStatus();

    const attributeDetails: MutableRefObject<Record<string, Record<string, Set<string>>>> = useRef({});

    useEffect(() => {
        trackInputFields[VisualFlowConstants.FLOW_BUILDER_PLUGIN_FUNCTION_IDENTIFIER] =
            "trackInputFields";
        validateExecutors[VisualFlowConstants.FLOW_BUILDER_PLUGIN_FUNCTION_IDENTIFIER] =
            "validateExecutors";

        PluginRegistry.getInstance().registerSync(EventTypes.ON_NODE_ELEMENT_CHANGE, trackInputFields);
        PluginRegistry.getInstance().registerSync(EventTypes.ON_EXECUTION_NODE_CHANGE, validateExecutors);

        return () => {
            PluginRegistry.getInstance().unregister(EventTypes.ON_NODE_ELEMENT_CHANGE,
                trackInputFields[VisualFlowConstants.FLOW_BUILDER_PLUGIN_FUNCTION_IDENTIFIER]);
            PluginRegistry.getInstance().unregister(EventTypes.ON_EXECUTION_NODE_CHANGE,
                validateExecutors[VisualFlowConstants.FLOW_BUILDER_PLUGIN_FUNCTION_IDENTIFIER]);
        };
    }, []);

    /**
     * Track input fields for a specific step and resource.
     * @param stepId - The ID of the step.
     * @param resource - The resource to track.
     */
    const trackInputFields = (stepId: string, resource: Resource): boolean => {
        if (resource.type === ElementTypes.Input) {
            if (attributeDetails.current[stepId]) {
                if (attributeDetails.current[stepId][resource.config?.identifier]) {
                    attributeDetails.current[stepId][resource.config?.identifier].add(resource.id);
                } else {
                    attributeDetails.current[stepId][resource.config?.identifier] = new Set([ resource.id ]);
                }
            } else {
                attributeDetails.current[stepId] = {
                    [resource.config?.identifier]: new Set([ resource.id ])
                };
            }
        }

        return true;
    };

    /**
     * Validates the executors for a given resource.
     * @param resource - The resource to validate.
     * @returns Whether the validation was successful.
     */
    const validateExecutors = (resource: Resource): boolean => {
        if (resource.type === StepTypes.Execution) {
            if (resource.data?.action?.executor?.name === ExecutionTypes.MagicLinkExecutor) {
                const ancestorSteps: string[] = resolveAncestorStepList(resource.id);

                if (ancestorSteps.length === 0) {
                    const error: Notification = new Notification(
                        `${resource.id}_EXECUTOR_ATTRIBUTE`,
                        "Missing required input fields",
                        NotificationType.ERROR
                    );

                    addNotification(error);
                }

                for (const ancestorStep of ancestorSteps) {
                    if (!attributeDetails.current[ancestorStep]
                        || !attributeDetails.current[ancestorStep]["http://wso2.org/claims/emailaddress"]) {
                        const error: Notification = new Notification(
                            `${resource.id}_EXECUTOR_ATTRIBUTE`,
                            "Missing required input fields",
                            NotificationType.ERROR
                        );

                        addNotification(error);
                    } else {
                        removeNotification(`${resource.id}_EXECUTOR_ATTRIBUTE`);
                    }
                }
            }
        }

        return true;
    };

    /**
     * Resolves the list of ancestor steps for a given step ID.
     * @param stepId - The ID of the step to resolve ancestors for.
     * @returns An array of ancestor step IDs.
     */
    const resolveAncestorStepList = (stepId: string) => {
        const ancestorSteps: string[] = [];
        const edges: Edge[] = getEdges();

        let currentEdge: Edge = edges.find((edge: Edge) => edge.target === stepId);

        while (currentEdge) {
            ancestorSteps.push(currentEdge.source);

            currentEdge = edges.find((edge: Edge) => edge.target === currentEdge.source);
        }

        return ancestorSteps;
    };
};

export default useExecutorValidation;
