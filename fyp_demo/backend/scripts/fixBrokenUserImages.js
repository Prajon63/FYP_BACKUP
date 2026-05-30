/**
 * Fix users in MongoDB whose Unsplash profile/photo URLs return 404.
 * Usage: node scripts/fixBrokenUserImages.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

async function urlOk(url) {
  if (!url?.includes('images.unsplash.com')) return true;
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return r.ok;
  } catch {
    return false;
  }
}

function fallback(seed, w = 400, h = 400) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(String(seed))}`;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}).select('_id username email profilePicture photos coverImage posts');
  let fixed = 0;

  for (const user of users) {
    let changed = false;
    const seed = user._id.toString();

    if (user.profilePicture && !(await urlOk(user.profilePicture))) {
      user.profilePicture = fallback(seed, 400, 400);
      changed = true;
    }
    if (user.coverImage && !(await urlOk(user.coverImage))) {
      user.coverImage = '';
      changed = true;
    }
    if (user.photos?.length) {
      const next = [];
      for (let i = 0; i < user.photos.length; i++) {
        const url = user.photos[i];
        if (await urlOk(url)) next.push(url);
        else changed = true;
      }
      if (next.length !== user.photos.length) {
        user.photos = next;
        changed = true;
      }
    }
    if (user.posts?.length) {
      for (const post of user.posts) {
        if (!post.images?.length) continue;
        const imgs = [];
        for (const url of post.images) {
          if (await urlOk(url)) imgs.push(url);
          else changed = true;
        }
        post.images = imgs;
      }
    }

    if (changed) {
      await user.save();
      fixed++;
      console.log('Fixed', user.username || user.email);
    }
  }

  console.log(`Done. Updated ${fixed} user(s).`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
