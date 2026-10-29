import React from "react";
import { useRouter } from "next/router";
import Search from "../nike/src/features/user/components/Search";
export default function Page() { const router = useRouter(); return <Search isOpen onClose={() => router.push("/home")} />; }
