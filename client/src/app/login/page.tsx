import Image from "next/image";
import React from "react";
import AuthImg from "@/public/Abstract Curves and Colors.jpeg";
import Logo from "@/components/Logo";
import AuthForm from "@/components/authentication/AuthForm";

const AuthenticationPage = () => {
  return (
    <main className="min-h-screen grid grid-cols-1 md:grid-cols-2 relative ">
      <div className="relative w-full flex flex-col bg-mutated p-6 md:p-10 text-primary-foreground min-h-[300px]">
        <div className="w-full h-[20%] md:h-[30%] bg-gradient-to-t from-transparent to-black/50 absolute top-0 left-0 z-10" />
        <div className="w-full h-[25%] md:h-[40%] bg-gradient-to-b from-transparent to-black/50 absolute bottom-0 left-0 z-10" />
        <Image
          src={AuthImg}
          alt="Authentication"
          fill
          className="w-full h-full object-cover"
        />
        <div className="relative z-10 flex items-center">
          <Logo />
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-base md:text-lg">
              &ldquo;Pictoria AI is a game changer for me. I have been able to
              generate high quality professional headshots within minutes. It
              has saved me countless hours of work and cost as well.&rdquo;
            </p>
            <footer className="text-xs md:text-sm">David S.</footer>
          </blockquote>
        </div>
      </div>
      <div className="relative flex flex-col items-center justify-center p-4 md:p-8 h-full w-full">
        <div className="w-full max-w-xs md:w-[350px] mx-auto md:max-w-xl">
          <AuthForm />
        </div>
      </div>
    </main>
  );
};

export default AuthenticationPage;
