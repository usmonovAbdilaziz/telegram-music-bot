module.exports = function channelCheck(channelUsernames = []) {
  return async (ctx, next) => {
    try {
      let notJoined = [];

      for (let username of channelUsernames) {
        const channel = `@${username}`;
        const member = await ctx.telegram.getChatMember(channel, ctx.from.id);

        if (!member || member.status === "left") {
          notJoined.push(channel);
        }
      }

      if (notJoined.length > 0) {
        // A’zo bo‘lmagan kanallarni ko‘rsatish
        return ctx.reply(
          `⚠️ Siz quyidagi kanal(lar)ga a’zo emassiz:\n\n${notJoined.join(
            "\n"
          )}\n\nIltimos, avval a’zo bo‘ling:`,
          {
            reply_markup: {
              inline_keyboard: [
                ...notJoined.map((ch) => [
                  {
                    text: `📢 Kanalga qo‘shilish`,
                    url: `https://t.me/${ch.replace("@", "")}`,
                  },
                ]),
                [{ text: "✅ Tekshirish", callback_data: "check_sub" }],
              ],
            },
          }
        );
      }

      // Agar barcha kanallarga a’zo bo‘lsa → keyingi handlerga o‘tish
      return next();
    } catch (err) {
      console.error("channelCheck error:", err);
      return ctx.reply("❌ Kanal a’zoligini tekshirishda xatolik yuz berdi.");
    }
  };
};
