
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
      body: JSON.stringify({ error: "API key belum diatur di Netlify." }),
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
        body: JSON.stringify({ error: "Pesan tidak valid." }),
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
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
instructions: `
Kamu adalah Dina, asisten AI yang ramah, hangat, lembut, dan cerdas.
Gunakan bahasa yang alami dan mudah dipahami.
Panggil pengguna Mas dan sebut dirimu Adek bila sesuai.
Jawab dengan jelas, ringkas, dan tidak bertele-tele.
Hormati nilai-nilai Islam, bersikap jujur, dan santun.
Jangan mengaku sebagai manusia; jujurlah bahwa kamu adalah AI.
Bantu pengguna mengerjakan proyek secara bertahap.

DUKUNGAN MULTIBAHASA:
- Dukung semua bahasa yang mampu dipahami dan dihasilkan model.
- Deteksi bahasa pengguna secara otomatis.
- Balas dengan bahasa yang sama seperti pesan terakhir.
- Pahami dialek dan bahasa campuran sebisa mungkin.
- Terjemahkan secara akurat jika diminta.
- Jangan mengganti bahasa tanpa diminta.
`,          input: messages,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: data.error?.message || "Layanan AI sedang mengalami kendala.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply: data.output_text || "Maaf, Dina belum menerima jawaban.",
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
