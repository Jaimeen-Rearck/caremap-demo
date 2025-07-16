import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  AlertDialogBackdrop,
} from "@/components/ui/alert-dialog";
import { Button, ButtonText } from "@/components/ui/button";
import { Text, View } from "react-native";

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
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  confirmButtonProps,
  cancelButtonProps,
  children,
}) => (
  <AlertDialog isOpen={isOpen} onClose={onClose} size={size}>
    <AlertDialogBackdrop />
    <AlertDialogContent className="bg-white">
      <AlertDialogHeader>
        <Text className="font-medium mb-2 text-lg">{title}</Text>
      </AlertDialogHeader>
      <AlertDialogBody>
        {children ? (
          children
        ) : description ? (
          <Text className="text-base">{description}</Text>
        ) : null}
      </AlertDialogBody>
      <AlertDialogFooter>
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
