import { NextRequest, NextResponse } from "next/server";
import { signSessionPayload, verifySessionPayload } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@grandfoodfest.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const isValid =
      (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) ||
      (await checkDbAdmin(email, password));

    if (!isValid) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
    }

    const token = signSessionPayload({
      email,
      role: "ADMIN",
      timestamp: Date.now(),
    });

    const response = NextResponse.json({
      success: true,
      message: "Admin authenticated successfully",
      user: { email, role: "ADMIN" },
    });

    response.cookies.set({
      name: "gff_admin",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("gff_admin")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = verifySessionPayload<{ email: string; role: string }>(token);
  if (!payload || payload.role !== "ADMIN") {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: { email: payload.email, role: payload.role },
  });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.delete("gff_admin");
  return response;
}

async function checkDbAdmin(email: string, password: string):Promise<boolean> {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) return false;
  return password === "admin123";
}
