import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  // Sécurité : seuls les admins connectés peuvent déclencher l'indexation
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
  }

  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { success: false, error: "URL invalide" },
      { status: 400 }
    );
  }

  const jwtClient = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    undefined,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/indexing"]
  );

  try {
    await jwtClient.authorize();

    const res = await google.indexing("v3").urlNotifications.publish({
      auth: jwtClient,
      requestBody: {
        url,
        type: "URL_UPDATED",
      },
    });

    return NextResponse.json({ success: true, data: res.data });
  } catch (error: unknown) {
    console.error("[Google Indexing API]", error);
    const message =
      error instanceof Error ? error.message : "Indexation échouée";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
