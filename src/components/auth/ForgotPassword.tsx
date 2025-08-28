"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AuthLayout from "./AuthLayout";

const formSchema = z.object({
  email: z.string().email({ message: "Неверный формат электронной почты." }),
});

const ForgotPassword = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { resetPassword } = useAuth();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setMessage("");
      setError("");
      setLoading(true);
      await resetPassword(values.email);
      setMessage("Проверьте свою почту для дальнейших инструкций.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Произошла неизвестная ошибка.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Забыли пароль?</CardTitle>
          <CardDescription>
            Введите свою электронную почту, и мы вышлем вам ссылку для сброса пароля.
          </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Электронная почта</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-500">{message}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Отправка..." : "Отправить ссылку для сброса"}
            </Button>
          </form>
        </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};

export default ForgotPassword;