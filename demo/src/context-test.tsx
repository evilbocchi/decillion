import React, { createContext, useContext } from "@rbxts/react";

const layerContext = createContext(0);

export default () => {
    const depth = useContext(layerContext);

    return <layerContext.Provider value={depth + 1}></layerContext.Provider>;
};
