const { YtDlp } = require("ytdlp-nodejs");
const { join } = require("path");
const {
  mkdirSync,
  existsSync,
  unlinkSync,
  readdirSync,
  statSync,
} = require("fs");

const ytdlp = new YtDlp();

// Fayl nomini xavfsiz qilish
function safeFileName(name) {
  return name.replace(/[<>:"/\\|?*]/g, "").slice(0, 100);
}

// Audio yuklash funksiyasi endi ctx va url parametrlarini qabul qiladi
async function downloadAudio(ctx, url) {
  try {
    const pathFile = join(__dirname, "..", "..", "uploads");
    if (!existsSync(pathFile)) mkdirSync(pathFile, { recursive: true });

    // Papkani tozalash
    for (const f of readdirSync(pathFile)) {
      unlinkSync(join(pathFile, f));
    }

    await ctx.reply("⏳ Audio yuklab olinmoqda...");

    const info = await ytdlp.getInfoAsync(url);
    const safeTitle = safeFileName(info.fulltitle || "audio");
    const outputPath = join(pathFile, safeTitle + ".mp3");

    // Audio yuklash
    await ytdlp.downloadAsync(url, {
      output: outputPath,
      extractAudio: true,
      audioFormat: "mp3",
      format: "bestaudio",
      noCheckCertificates: true,
      progressHook: (progress) => {
        if (progress.status === "downloading") {
          console.log(
            `⬇️ Audio yuklanmoqda: ${(
              progress.downloaded_bytes /
              1024 /
              1024
            ).toFixed(2)} MB`
          );
        } else if (progress.status === "finished") {
          console.log("✅ Audio yuklandi!");
        }
      },
    });

    if (!existsSync(outputPath)) {
      return await ctx.reply("❌ Audio yuklab bo‘lmadi.");
    }

    // Hajmni tekshirish
    const stats = statSync(outputPath);
    const actualMB = stats.size / (1024 * 1024);
    if (actualMB > 45) {
      unlinkSync(outputPath);
      return ctx.reply(
        `⚠️ Audio hajmi ${actualMB.toFixed(
          2
        )} MB — 45 MB dan katta bo‘lgani uchun yubora olmayman.`
      );
    }

    // Foydalanuvchiga audio yuborish
    await ctx.replyWithAudio(
      { source: outputPath },
      { caption: `🎵 ${info.fulltitle}` }
    );

    // Faylni o‘chirish
    unlinkSync(outputPath);
  } catch (error) {
    console.error("Audio yuklashda xatolik:", error);
    return ctx.reply("❌ Audio yuklab olishda xatolik yuz berdi.");
  }
}

module.exports = { downloadAudio };
