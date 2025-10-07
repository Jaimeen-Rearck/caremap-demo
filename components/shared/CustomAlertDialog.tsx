import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  AlertDialogBackdrop,
} from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import palette from "@/utils/theme/color";
import { Text } from "react-native";

interface CustomAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  confirmButtonProps?: object;
  cancelButtonProps?: object;
  children?: React.ReactNode; // for custom body
}

export const CustomAlertDialog: React.FC<CustomAlertDialogProps> = ({
  isOpen,
  onClose,
  size = "lg",
  title = "Are you sure you want to delete?",
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  confirmButtonProps = {
    style: { backgroundColor: palette.primary, marginLeft: 8 },
  },
  cancelButtonProps,
  children,
}) => (
  <AlertDialog isOpen={isOpen} onClose={onClose} size={size}>
    <AlertDialogBackdrop />
    <AlertDialogContent className="bg-white">
      <AlertDialogHeader>
        <Text className="font-medium mb-1 text-lg">{title}</Text>
      </AlertDialogHeader>
      <AlertDialogBody>
        {children ? (
          children
        ) : description ? (
          <Text className="text-base">{description}</Text>
        ) : null}
      </AlertDialogBody>
      <AlertDialogFooter className="mt-3">
        <Button
          variant="solid"
          action="secondary"
          onPress={onClose}
          size="md"
          {...cancelButtonProps}
        >
          <ButtonText>{cancelText}</ButtonText>
        </Button>
        <Button size="md" onPress={onConfirm} {...confirmButtonProps}>
          <ButtonText>{confirmText}</ButtonText>
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
