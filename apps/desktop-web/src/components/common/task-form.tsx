import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import * as z from "zod";

import { Button } from "@/components/ui/button";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { IconLoader2, IconPlus } from "@tabler/icons-react";
import { useTransition } from "react";
import { TodoService } from "shared-db";
import { InputGroup, InputGroupInput } from "../ui/input-group";

const formSchema = z.object({
  title: z
    .string()
    .min(5, "Bug title must be at least 5 characters.")
    .max(32, "Bug title must be at most 32 characters."),
});

const TITLE_LIMIT = 280;

export function TaskForm() {
  const isOnline = useOnlineStatus();

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await TodoService.create(data.title);
      } catch (err) {
        console.error("Database error: ", err);
      } finally {
        form.reset();
        console.log(data);
      }
    });
  }

  const hint = isOnline
    ? "Stored on this device, then synced."
    : "Offline. This stays on this device until you reconnect.";

  return (
    <form
      id="form-rhf-task"
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex gap-4"
    >
      <FieldGroup className="flex-1">
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="form-rhf-task-title">Title</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  {...field}
                  id="form-rhf-task-title"
                  aria-invalid={fieldState.invalid}
                  placeholder="What needs to be done?"
                  autoFocus
                  autoComplete="off"
                  maxLength={TITLE_LIMIT}
                  disabled={isPending}
                />
              </InputGroup>
              <FieldDescription className="text-xs">{hint}</FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button
        type="submit"
        variant="outline"
        form="form-rhf-task"
        className="self-center mt-2"
        disabled={isPending}
      >
        {isPending ? (
          <IconLoader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <IconPlus data-icon="inline-start" />
        )}
        {isPending ? "Adding" : "Add"}
      </Button>
    </form>
  );
}
