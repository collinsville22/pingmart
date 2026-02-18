import { NextResponse } from "next/server";
import { checkNames } from "@/lib/naming/client";
import { NameCheckQuerySchema } from "@/lib/utils/validation";
import { toErrorResponse, toStatusCode } from "@/lib/utils/errors";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = NameCheckQuerySchema.parse({
      names: searchParams.get("names") || searchParams.get("domains") || "",
    });

    const results = await checkNames(parsed.names);

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: toErrorResponse(error) },
      { status: toStatusCode(error) },
    );
  }
}
