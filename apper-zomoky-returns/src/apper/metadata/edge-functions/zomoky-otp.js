function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function normalizeMobile(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return null;
}

apper.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, message: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const action = body?.action;
    const mobile = normalizeMobile(body?.mobile);

    if (!mobile) return json({ ok: false, message: "Enter a valid 10-digit Indian mobile number." }, 400);

    if (action !== "verify-access-token") {
      return json({ ok: false, message: "Invalid OTP action." }, 400);
    }

    const authkey = Deno.env.get("MSG91_AUTHKEY");
    if (!authkey) {
      return json({ ok: false, message: "MSG91 server authentication is not configured in Apper." }, 500);
    }

    const accessToken = String(body?.accessToken ?? "").trim();
    if (!accessToken) {
      return json({ ok: false, message: "MSG91 verification token is missing." }, 400);
    }

    const response = await fetch("https://control.msg91.com/api/v5/widget/verifyAccessToken", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        authkey,
        "access-token": accessToken,
      }),
    });

    const result = await response.json().catch(() => ({}));
    const success =
      response.ok &&
      (
        result?.type === "success" ||
        result?.message === "success" ||
        result?.message === "Access token verified successfully"
      );

    return json(
      {
        ok: success,
        message: success ? "OTP verified successfully." : (result?.message || "Invalid or expired OTP."),
        data: success ? result : undefined,
      },
      success ? 200 : 400,
    );
  } catch (error) {
    return json({ ok: false, message: error?.message || "OTP service is temporarily unavailable." }, 500);
  }
});