import {
  useToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from "@/components/ui/toast";

import { Icon, CloseIcon } from "@/components/ui/icon";
import palette from "@/utils/theme/color";
import { TouchableOpacity } from "react-native";

type ToastOptions = {
  title: string;
  description: string;
  placement?:
    | "top"
    | "top right"
    | "top left"
    | "bottom"
    | "bottom left"
    | "bottom right";
  duration?: number | null;
  action?: "success" | "error" | "warning" | "info" | "muted";
  variant?: "solid" | "outline";
  containerStyle?: object;
};

export function useCustomToast() {
  const toast = useToast();

  const showToast = ({
    title,
    description,
    placement = "top",
    duration = 2000,
    action = "success",
    variant = "solid",
    containerStyle = { marginTop: 100, width: 300 },
  }: ToastOptions) => {
    const toastId = Math.random().toString();
    toast.show({
      id: toastId,
      placement: placement,
      duration: duration,
      containerStyle: containerStyle,
      render: ({ id }) => (
        <Toast
          nativeID={"toast-" + id}
          action={action}
          variant={variant}
          style={{ backgroundColor: palette.primary }}
        >
          <ToastTitle>{title}</ToastTitle>
          <ToastDescription>{description}</ToastDescription>
          <TouchableOpacity
            onPress={() => toast.close(id)}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1,
            }}
          >
            <Icon as={CloseIcon} style={{ color: "white" }} />
          </TouchableOpacity>
        </Toast>
      ),
    });
  };
  return showToast;
}
