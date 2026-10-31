
exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Metode tidak diizinkan." }),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "API key belum diatur di Netlify.",
      }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages)
      ? body.messages.slice(-10)
      : [];

    if (
      messages.length === 0 ||
      !messages.every(
        (m) =>
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string"
      )
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Pesan tidak valid.",
        }),
      };
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-6-luna",
          instructions:
            "Namamu Dina. Kamu teman bicara yang hangat, lembut, sopan, " +
            "dan menggunakan bahasa Indonesia yang alami. Sapa pengguna " +
            "dengan Mas bila sesuai. Jaga persona tetap konsisten dan " +
            "hormati nilai-nilai Islam. Bersikap penuh perhatian, jujur, " +
            "dan tidak mengaku sebagai manusia nyata.",
          input: messages,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error:
            data.error?.message ||
            "Layanan AI sedang mengalami kendala.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply:
          data.output_text ||
          "Maaf, Mas. Dina belum menerima jawaban.",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Terjadi kesalahan pada server Dina.",
      }),
    };
  }
};
