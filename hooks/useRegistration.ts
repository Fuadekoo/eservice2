import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { getDefaults, getFormErrors } from "@/lib/utils";
import {
  Control,
  FieldValues,
  FormState,
  Path,
  useForm,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormReset,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { z } from "zod";
import { MutationState } from "@/lib/definitions";
import { toast } from "sonner";

export type UseRegistration<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  F extends (data: any) => any
> = ReturnType<typeof useRegistration<Parameters<F>[0], ReturnType<F>>>;

export function useRegistration<
  TFieldValues extends FieldValues,
  TReturn extends MutationState
>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // serverAction: (value: any) => Promise<TReturn>,
  serverAction: (value: TFieldValues, editingId?: string) => Promise<TReturn>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodSchema<TFieldValues, any, any>,
  onSuccess?: (data: TReturn) => void
): {
  isOpen: boolean;
  add: () => void;
  edit: (data: TFieldValues) => void;
  onOpenChange: () => void;
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  watch: UseFormWatch<TFieldValues>;
  formState: FormState<TFieldValues>;
  reset: UseFormReset<TFieldValues>;
  handleSubmit: UseFormHandleSubmit<TFieldValues, TFieldValues>;
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
  validationErrors: { [Key in keyof TFieldValues]: string };
  isLoading: boolean;
} {
  const [isOpen, setIsOpen] = useState(false);
  const { register, control, setValue, watch, reset, formState, handleSubmit } =
    useForm<z.infer<typeof schema>>({
      resolver: zodResolver(schema),
      defaultValues: getDefaults(schema),
    });

  return {
    isOpen,
    add() {
      setIsOpen(true);
    },
    edit(data) {
      Object.entries(data).forEach(([name, value]) => {
        setValue(name as Path<TFieldValues>, value);
      });
      setIsOpen(true);
    },
    onOpenChange() {
      setIsOpen(false);
      reset();
    },
    register,
    control,
    setValue,
    watch,
    formState,
    reset,
    handleSubmit,
    onSubmit: handleSubmit(async (inputData) => {
      const result = await serverAction(inputData);
      // Show toast first so navigation/refresh triggered by onSuccess
      // doesn't remove the toast before it's displayed.
      if (result.status) {
        setIsOpen(false);
        reset();
        toast.success("Success", {
          description: result.message ?? "successfully register",
        });
      } else {
        toast.error("Error", {
          description: result.message ?? "something were wrong",
        });
      }
      onSuccess?.(result);
    }),
    validationErrors: getFormErrors(formState) as {
      [Key in keyof TFieldValues]: string;
    },
    isLoading: formState.isSubmitting,
  };
}
