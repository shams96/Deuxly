import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    if (!(await checkRateLimit(`signup:${ip}`, 5, 60 * 60_000))) {
      return NextResponse.json(
        { error: "Too many sign-up attempts. Try again later." },
        { status: 429 },
      );
    }

    const { name, email, password } = await request.json();

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }
    if (name.length > 120 || email.length > 200) {
      return NextResponse.json({ error: "Name or email too long" }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    if (password.length < 8 || password.length > 200) {
      return NextResponse.json(
        { error: "Password must be 8–200 characters" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: { name: name.trim(), email: normalizedEmail, password: hashedPassword },
    });

    return NextResponse.json({ message: "User created successfully" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
