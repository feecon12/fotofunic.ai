"use client"
import React, { useState } from 'react'
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

const formSchema = z.object({
    email: z.string().email({
        message:"Please enter a valid email address!"
    })

})

const ForgetpasswordForm = ({ className }: { className?: string }) => {
      const [loading, setLoading] = useState(false);
  
  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }
  return (
    <div className={cn("grid gap-6", className)}>
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ForgetpasswordForm;