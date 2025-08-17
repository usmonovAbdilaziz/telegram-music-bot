const { message } = require("telegraf/filters");
const { downloadVideo } = require("./bot.on");
const channelCheck = require("../guards/auth.guard");
const pTimeout = require("p-timeout");
const { saveUser } = require("./user.controller.js"); // User controller ulash

function isUrl(text) {
  const urlPattern = /^(https?:\/\/[^\s]+)$/i;
  return urlPattern.test(text);
}

module.exports = class botController {
  init(bot) {
    // /start komandasi
    bot.start(async (ctx) => {
      await saveUser(ctx);
      ctx.reply(
        "✅ Botga xush kelibsiz!\nLink yuboring va video yuklab olasiz."
      );
    });

    // /help komandasi
    bot.help((ctx) => {
      ctx.reply("/start - Botni qayta ishga tushurish");
    });

    // Oddiy matn handler
    bot.on(message("text"), async (ctx, next) => {
      const text = ctx.message.text;

      if (text.startsWith("/")) return next();

      await saveUser(ctx);

      const channels = ["kosmetika_with_Fab", "video_add_music"];

      if (isUrl(text)) {
        await channelCheck(channels)(ctx, async () => {
          try {
            await pTimeout(downloadVideo(ctx, text), 180000);
          } catch (err) {
            console.error("Fayl yuklashda xatolik:", err);
            await ctx.reply("❌ Fayl yuklashda xatolik yuz berdi.");
          }
        });
      } else {
        await ctx.reply(
          `❌ Siz yuborgan matn: "${text}"\nFaqat video link yuboring!`
        );
      }
    });

    // Faqat kanal tekshirish callback qoldirildi
    bot.on("callback_query", async (ctx) => {
      const data = ctx.update.callback_query.data;

      await saveUser(ctx);

      if (data === "check_sub") {
        const channels = ["kosmetika_with_Fab", "video_add_music"];
        let notJoined = [];

        for (let username of channels) {
          try {
            const member = await ctx.telegram.getChatMember(
              `@${username}`,
              ctx.from.id
            );
            if (!member || member.status === "left")
              notJoined.push(`@${username}`);
          } catch (err) {
            console.error("check_sub error:", err);
          }
        }

        if (notJoined.length > 0) {
          await ctx.reply(
            `⚠️ Siz hali quyidagi kanal(lar)ga a’zo emassiz:\n${notJoined.join(
              "\n"
            )}\n\nIltimos, avval a’zo bo‘ling va "✅ Tekshirish" tugmasini bosing.`
          );
          return ctx.answerCbQuery(
            "⚠️ Siz hali barcha kanallarga a’zo emassiz!",
            {
              show_alert: true,
            }
          );
        } else {
          await ctx.reply(
            "✅ Tabriklaymiz! Siz barcha kanallarga a’zosiz. Endi video linkini qayta yuboring."
          );
          return ctx.answerCbQuery("✅ Siz barcha kanallarga a’zosiz!", {
            show_alert: true,
          });
        }
      }
    });
  }
};
