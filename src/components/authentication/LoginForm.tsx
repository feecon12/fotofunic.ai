"use client"
import React, { useId, useState } from 'react'
import { z } from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button";
import {useForm} from "react-hook-form"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { login } from '@/app/actions/auth-actions';

const formSchema = z.object({
    email: z.string().email({
        message:"Please enter a valid email address!"
    }),
    password: z.string().min(8,{
        message:"Password must be atleast 8 characters long."
    }),

})

const LoginForm = ({ className }: { className?: string }) => {
      const [loading, setLoading] = useState(false);
      const toastId = useId();
  
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    toast.loading("Logging you in...", { id: toastId });
    setLoading(true);
    // Do something with the form values.
    // ✅ This will be type-safe and validated.

    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);
    // formData.append("confirmPassword", values.confirmPassword);

    const { success, error } = await login(formData);
    if (!success) {
      toast.error(error, { id: toastId });
      setLoading(false);
    } else {
      toast.success(
        "Login successful! Redirecting to your dashboard...",
        { id: toastId }
      );
      setLoading(false);
      form.reset();
      redirect("/dashboard");
    }
    console.log(values);
  }
    return (
      <div className={cn('grid gap-6', className)}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className='w-full' disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Login"}
            </Button>
          </form>
        </Form>
      </div>
    );
}

export default LoginForm