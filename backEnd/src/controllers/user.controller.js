import * as userService from "../service/user.service.js";
import { getEmailFromAccessToken } from "../utils/helperToken.js";

//pas de create_user car c'est deja fait dans sign_Up

export const listUserConnected = async (req, res, next) => {
  try {
    req.query.page = req.query.page ?? 1;
    req.query.limit = req.query.limit ?? 10;
    const query = { isConnected: true };

    const userList = await userService.getAllUser(
      {
        page: req.query.page,
        limit: req.query.limit,
      },
      query
    );

    res.status(200).json(userList);
  } catch (err) {
    next(err);
  }
};

export const comparePassword = async (req, res, next) => {
    try {
    const email = req.email;

    const { password } = req.body;

    const attempt = await userService.isPassword(email, password);

    if (attempt){
      res.status(200).json({
        status : attempt
      })
    }else{
        res.status(404).json({
        status : attempt
      });
    }
  } catch (err) {
    next(err);
  }
}

// Ajouter ces fonctions au contrôleur existant

export const listUsersForAdmin = async (req, res, next) => {
  try {
    req.query.page = req.query.page ?? 1;
    req.query.limit = req.query.limit ?? 100; // Augmenter la limite pour l'admin

    const userList = await userService.getAllUser({
      page: req.query.page,
      limit: req.query.limit,
    });

    console.log(userList);

    res.status(200).json(userList);
  } catch (err) {
    next(err);
  }
};

export const adminUpdateUserStatus = async (req, res, next) => {
  try {
    const { email } = req.params;
    const { status } = req.body;
    const adminEmail = req.email; // Email de l'admin provenant du token

    // Validation du statut
    const validStatuses = ["Utilisateur", "Responsable", "EnCours", "Admin"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    // Vérifier si l'utilisateur est un admin
    const adminUser = await userService.getUserByEmail(adminEmail);
    if (!adminUser || adminUser.status !== "Admin") {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    const updatedUser = await userService.updateUserStatus(email, status);
    
    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

export const adminDeleteUser = async (req, res, next) => {
  try {
    const { email } = req.params;
    const adminEmail = req.email; // Email de l'admin provenant du token

    // Vérifier si l'utilisateur est un admin
    const adminUser = await userService.getUserByEmail(adminEmail);
    if (!adminUser || adminUser.status !== "Admin") {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    // Supprimer l'utilisateur sans vérification de mot de passe pour l'admin
    const user = await userService.deleteUserByAdmin(email);
    
    if (user === null) return res.sendStatus(404);
    
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};

export const getAProfile = async (req, res, next) => {
  try {
    const email = req.email;

    const user = await userService.getUserByEmail(email);

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const email = req.email;
    const updateData = req.body;

    if (req.file) {
      userService.updateUserAvatar(email, req.file.path);
    }
    const newUser = await userService.updateUser(email, updateData);

    if (newUser === null ) return res.sendStatus(409);
    
    res.status(200).json(newUser);
  } catch (err) {
    next(err);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { email } = req.email;
    const { status } = req.body;

    // Validation du statut
    const validStatuses = ["Utilisateur", "Responsable", "EnCours", "Admin"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const updatedUser = await userService.updateUserStatus(email, status);
    
    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    next(err);
  }
};

export const deleteCompte = async (req, res, next) => {
  try {
    const email = req.email;
    const { password } = req.body;

    const user = await userService.deleteUserByEmail(email, password);
    
    if (user === null) return res.sendStatus(404);
    
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    });

    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};
