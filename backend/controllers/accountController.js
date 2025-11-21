const fs = require('fs');
const path = require('path');
const AccountModel = require('../models/AccountModel');

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');
const AVATAR_DIR = path.join(UPLOADS_ROOT, 'avatars');

const ensureAvatarDir = () => {
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
};

const saveBase64Image = (base64String, userId) => {
  if (!base64String) return null;
  const matches = base64String.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Formato de imagen inválido');
  }

  const mime = matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');

  const maxBytes = 2 * 1024 * 1024; // 2MB
  if (buffer.length > maxBytes) {
    throw new Error('La imagen supera los 2MB permitidos');
  }

  const extension = mime.split('/')[1] === 'jpeg' ? 'jpg' : mime.split('/')[1];
  const filename = `avatar_${userId}_${Date.now()}.${extension}`;
  ensureAvatarDir();
  const filePath = path.join(AVATAR_DIR, filename);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/avatars/${filename}`;
};

const deleteFileIfExists = (filePath) => {
  if (!filePath) return;
  try {
    const relative = filePath.replace(/^\/?uploads\/?/, '');
    const absolute = path.join(UPLOADS_ROOT, relative.replace(/^\//, ''));
    if (fs.existsSync(absolute)) {
      fs.unlinkSync(absolute);
    }
  } catch (error) {
    console.warn('No se pudo eliminar avatar anterior:', error.message);
  }
};

class AccountController {
  static async getSummary(req, res) {
    try {
      const data = await AccountModel.getAccountSummary(req.user.id_usuario);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Cuenta no encontrada' });
      }
      return res.json({ success: true, data });
    } catch (error) {
      console.error('AccountController.getSummary error:', error);
      return res.status(500).json({ success: false, message: 'No se pudo cargar el resumen de la cuenta' });
    }
  }

  static async updateProfile(req, res) {
    try {
      const {
        telefonoAlterno,
        telefonoPrincipal,
        extension,
        timezone,
        bio,
        firmaDigital,
        avatarColor,
        avatarBase64,
        removeAvatar
      } = req.body;

      let avatarUrl;
      if (avatarBase64) {
        avatarUrl = saveBase64Image(avatarBase64, req.user.id_usuario);
      }

      if (removeAvatar) {
        avatarUrl = null;
      }

      if (avatarUrl === undefined) {
        const existing = await AccountModel.getRawProfile(req.user.id_usuario);
        avatarUrl = existing ? existing.avatar_url : null;
      } else {
        // Remove previous avatar if new one uploaded or removal requested
        const existing = await AccountModel.getRawProfile(req.user.id_usuario);
        if (existing && existing.avatar_url) {
          deleteFileIfExists(existing.avatar_url);
        }
      }

      const payload = {
        telefono_alterno: telefonoAlterno || null,
        extension: extension || null,
        timezone: timezone || 'America/Bogota',
        bio: bio || null,
        firma_digital: firmaDigital || null,
        avatar_color: avatarColor || '#B39237',
        avatar_url: avatarUrl
      };

      await AccountModel.upsertProfile(req.user.id_usuario, payload);
      const cleanedTelefono = typeof telefonoPrincipal === 'string' ? telefonoPrincipal.trim() : null;
      if (cleanedTelefono) {
        await AccountModel.updateEmployeeContact(req.user.id_usuario, { telefono: cleanedTelefono });
      }
      const summary = await AccountModel.getAccountSummary(req.user.id_usuario);
      return res.json({ success: true, data: summary, message: 'Perfil actualizado correctamente' });
    } catch (error) {
      console.error('AccountController.updateProfile error:', error);
      return res.status(400).json({ success: false, message: error.message || 'No se pudo actualizar el perfil' });
    }
  }

  static async updatePreferences(req, res) {
    try {
      const {
        idioma,
        tema,
        notificar_email,
        notificar_push,
        notificar_inventario,
        notificar_ciclos,
        resumen_semanal
      } = req.body;

      const payload = {
        idioma: idioma || 'es',
        tema: ['claro', 'oscuro', 'sistema'].includes(tema) ? tema : 'sistema',
        notificar_email: Boolean(notificar_email),
        notificar_push: Boolean(notificar_push),
        notificar_inventario: Boolean(notificar_inventario),
        notificar_ciclos: Boolean(notificar_ciclos),
        resumen_semanal: Boolean(resumen_semanal)
      };

      const summary = await AccountModel.upsertPreferences(req.user.id_usuario, payload);
      return res.json({ success: true, data: summary, message: 'Preferencias guardadas' });
    } catch (error) {
      console.error('AccountController.updatePreferences error:', error);
      return res.status(500).json({ success: false, message: 'No se pudieron actualizar las preferencias' });
    }
  }

  static async getNotifications(req, res) {
    try {
      const { page = 1, pageSize = 10, filter = 'all' } = req.query;
      const data = await AccountModel.getNotifications(req.user.id_usuario, { page, pageSize, filter });
      return res.json({ success: true, data });
    } catch (error) {
      console.error('AccountController.getNotifications error:', error);
      return res.status(500).json({ success: false, message: 'No se pudieron obtener las notificaciones' });
    }
  }

  static async markNotification(req, res) {
    try {
      const { id } = req.params;
      const { read = true } = req.body;
      const updated = await AccountModel.markNotification(req.user.id_usuario, id, Boolean(read));
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
      }
      return res.json({ success: true, message: 'Notificación actualizada' });
    } catch (error) {
      console.error('AccountController.markNotification error:', error);
      return res.status(500).json({ success: false, message: 'No se pudo actualizar la notificación' });
    }
  }

  static async markAllRead(req, res) {
    try {
      const count = await AccountModel.markAllNotifications(req.user.id_usuario);
      return res.json({ success: true, data: { count }, message: 'Todas las notificaciones fueron marcadas como leídas' });
    } catch (error) {
      console.error('AccountController.markAllRead error:', error);
      return res.status(500).json({ success: false, message: 'No se pudieron marcar las notificaciones' });
    }
  }

  static async createTestNotification(req, res) {
    try {
      const { titulo, mensaje, tipo, metadata } = req.body;
      if (!titulo || !mensaje) {
        return res.status(400).json({ success: false, message: 'Título y mensaje son obligatorios' });
      }
      const id = await AccountModel.createNotification(req.user.id_usuario, {
        titulo,
        mensaje,
        tipo: tipo || 'sistema',
        metadata
      });
      return res.status(201).json({ success: true, data: { id }, message: 'Notificación creada' });
    } catch (error) {
      console.error('AccountController.createTestNotification error:', error);
      return res.status(500).json({ success: false, message: 'No se pudo crear la notificación' });
    }
  }
}

module.exports = AccountController;
