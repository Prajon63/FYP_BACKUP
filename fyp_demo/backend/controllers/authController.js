/*
yesma, basically models bata prepared bhayeko data(user info,product/service info etc) lai k logic lagaune 
ra data lai kasari handle garne core logic hunxa 
*/

//models bata data import gareko
import { create, findOne } from '../models/User.js';  

//used for encryption(data handling example, data safe rakhnu)
// import { hash, compare } from 'bcryptjs';   // yo method ni commomjs bhayo

import bcrypt from 'bcryptjs';
const {hash,compare}= bcrypt;  //hash() ra compare() is accessed from bcrypt now!!

//1
//yo async func ma register logic handle bhairaxa; router ma yo func export hunxa so exports.register is used
// export async function register(req, res) {
//   const { email, password } = req.body;  //input field empty narakhna lai
//   const hashed = await bcrypt.hash(password, 10);  //password property lai hash garne await
//   try {
//     const user = await create({ email, password: hashed });  //try bhitra user successfully create ra pw hashed bhako herxa
//     res.json({ success: true, user: { email } });
//   } catch (err) {
//     res.json({ success: false, error: 'Email already registered' });  //error ma only email taken falxa
//   }
// }


//2 
export async function register(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    
    const user = await create({ email, password: hashed });
    
    return res.status(201).json({ 
      success: true, 
      user: { email } 
    });

  } catch (err) {
    console.error("Registration error:", err); // ← very important! log real error

    // Check for MongoDB duplicate key error (error code 11000)
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // For all other errors, show more info (at least during development)
    return res.status(500).json({ 
      success: false, 
      error: 'Server error during registration',
      detail: err.message   // ← remove this in production!
    });
  }
}



//same as register
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findOne({ email });  //user db ma xa ki nai check garxa
  if (user && await bcrypt.compare(password, user.password)) {  //if true bhayo bhane
    res.json({ success: true, user: { email } });            // success dekhauxa
  } else {
    res.json({ success: false, error: 'Invalid credentials' });
  }
}

export async function preference(req,res) {
  const { userId, gender, ageRange } = req.body;
  // save preferences in DB
  res.json({ success: true, message: 'Preferences saved!' });
}