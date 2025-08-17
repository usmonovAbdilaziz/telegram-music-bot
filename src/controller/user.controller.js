const User = require("../db/schema"); // User modelni ulash

// Foydalanuvchini DB ga saqlash yoki yangilash
async function saveUser(ctx) {
  try {
    const { id, username, first_name, last_name } = ctx.from;

    let user = await User.findOne({ userId: id });

    if (!user) {
      // Yangi foydalanuvchini yozamiz
      user = new User({
        userId: id,
        username,
        first_name,
        last_name,
      });
      await user.save();
      console.log("✅ Yangi user saqlandi:", user);
    } else {
      // Agar mavjud bo‘lsa ma’lumotlarini update qilamiz
      user.username = username;
      user.first_name = first_name;
      user.last_name = last_name;
      await user.save();
      console.log("ℹ️ Foydalanuvchi yangilandi:", user);
    }

    return user;
  } catch (err) {
    console.error("❌ User saqlashda xatolik:", err);
    return null;
  }
}

module.exports = { saveUser };
