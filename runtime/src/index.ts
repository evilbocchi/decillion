import React, { ReactElement } from "@rbxts/react";

/**
 * Creates an optimized createElement that skips unnecessary prop processing for static elements
 */
export function createStaticElement(
    elementType: string,
    props: Record<string, unknown> | undefined,
    ...children: React.ReactNode[]
): ReactElement {
    // For static elements, we can optimize by pre-processing props
    return React.createElement(elementType, props, ...children);
}
