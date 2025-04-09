import React, { ForwardedRef, RefObject } from "react";
import { TouchableOpacity, TouchableOpacityProps, View } from "react-native";

export default React.memo(
  React.forwardRef((props: TouchableOpacityProps & { children?: React.ReactNode }, ref: ForwardedRef<View>) => {
    return <TouchableOpacity ref={ref} {...props} />;
  })
);
