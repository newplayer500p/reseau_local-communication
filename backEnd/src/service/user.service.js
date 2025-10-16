import UserModel from "../models/User.model.js";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import { verifyPassword } from "../utils/helperPassword.js";

const __dirname = import.meta.dirname;
const saltRound = 6;

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(saltRound);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export const creatUser = async (userData, newAvatarName) => {
  try {
    if (
      userData.nom !== null &&
      userData.email !== null &&
      userData.password !== null &&
      newAvatarName !== null
    ) {
      const email = userData.email;

      if (await getUserByEmail(email) === null) {
        userData.avatar = newAvatarName;
        userData.password = await hashPassword(userData.password);

        const user = await UserModel.create(userData);

        console.log(user);

        return user;
      }
    }
    return null;
  } catch (err) {
    console.log("erreur de creation: ", err);
    return null;
  }
};

export const updateUserAvatar = async (email, newAvatarName) => {
  try {
    const user = await UserModel.findOne({ email: email });
    const oldAvatar = path.join(
      __dirname,
      "..",
      "..",
      user.avatar
    );
    fs.unlinkSync(oldAvatar);

    user.avatar = newAvatarName;
    user.save();

    return true;
  } catch (err) {
    console.log("Erreur lors du mise a jour: ", err);
    return false;
  }
};

export const updateUser = async (email, userData) => {
  try {
    if (userData.email !== null && (await getUserByEmail(userData.email).length) === 0)
      return null;

    if (userData.password !== null) {
      userData.password = await hashPassword(userData.password);
    }

    const user = await UserModel.findOneAndUpdate({ email: email }, userData, {
      new: true,
      runValidators: true,
    })
      .select("-password")
      .lean();

    return user;
  } catch (err) {
    console.log("erreur de creation: ", err);
    return null;
  }
};

export const getAllUser = async (paginationAndLimite, query = {}) => {
  try {
    const users = await UserModel.find(query)
      .skip((paginationAndLimite.page - 1) * paginationAndLimite.limit)
      .limit(Number(paginationAndLimite.limit))
      .sort({ createdAt: -1 })
      .select("-password")
      .lean();

    return users;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const user = await UserModel.findOne({ email: email })
      .select("-password")
      .lean();

    if (user === null) {
      return null;
    }

    return user;
  } catch (err) {
    console.log("Erreur de recuperation: ", err);
    return null;
  }
};

export const isPassword = async (email, passwordUser) => {
  try {
    const { password } = await UserModel.findOne({ email: email })
      .lean();
    return await verifyPassword(passwordUser, password);
  } catch (err) {
    console.log("Erreur de verification: ", err);
    return false;
  }
}

export const checkIsUser = async (email, password) => {
  try {
    const user = await UserModel.findOne({ email: email }).lean();

    if (user !== null) {
      const isTrue = await bcrypt.compare(password, user.password);
      if (isTrue) {
        return {
          email: user.email,
          nom: user.nom,
          status: user.status,
          avatar: user.avatar,
        };
      }
    }
    return null;
  } catch (err) {
    console.log("Erreur de verification: ", err);
    return null;
  }
};

export const updateUserStatus = async (email, newStatus) => {
  try {
    const user = await UserModel.findOneAndUpdate(
      { email: email },
      { status: newStatus },
      { new: true, runValidators: true }
    ).select("-password").lean();

    return user;
  } catch (err) {
    console.log("Erreur lors de la mise à jour du statut: ", err);
    return null;
  }
};

export const deleteUserByEmail = async (email, passwordUser) => {
  try {
    const {password} = await UserModel.findOne({ email: email }).lean();
    const isTrue = await verifyPassword(passwordUser, password);


    if (isTrue){
      const attempt = await UserModel.findOneAndDelete({email: email}).lean();
      const oldAvatar = path.join(
        __dirname,
        "..",
        "..",
        attempt.avatar
      );
      fs.unlinkSync(oldAvatar);
      return attempt;
    }

    return null;
  } catch (err) {
    console.log("Erreur de recuperation: ", err);
    return null;
  }
};

// Ajouter cette fonction au service existant

export const deleteUserByAdmin = async (email) => {
  try {
    const user = await UserModel.findOneAndDelete({ email: email }).lean();
    if (user) {
      const oldAvatar = path.join(
        __dirname,
        "..",
        "..",
        user.avatar
      );
      // Vérifier si le fichier existe avant de le supprimer
      if (fs.existsSync(oldAvatar)) {
        fs.unlinkSync(oldAvatar);
      }
    }
    return user;
  } catch (err) {
    console.log("Erreur de suppression par admin: ", err);
    return null;
  }
};
