"use client";

import React from "react";
import SideBar from "./sidebar";
import Header from "./header";
import Image from "next/image";

export default function UserLayout({
  children,
  menu,
}: {
  children: React.ReactNode;
  menu: {
    key: string;
    url: string;
    Icon: React.ReactNode;
  }[][];
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-200 to-secondary-200 grid min-h-screen">
      <div className="z-0 absolute inset-0 grid place-content-center">
        <Image
          alt=""
          src={"/logo.png"}
          width={1000}
          height={1000}
          className="size-60 md:size-96 opacity-20"
        />
      </div>
      <div className="z-10 flex overflow-hidden min-h-screen">
        <input type="checkbox" id="sidebar" className="hidden peer/sidebar" defaultChecked />
        <SideBar {...{ menu }} />
        <div className="flex-1 overflow-hidden flex flex-col min-h-screen w-full transition-all duration-300">
          <Header />
          <article className="flex-1 overflow-auto w-full">{children}</article>
        </div>
      </div>
    </div>
  );
}
