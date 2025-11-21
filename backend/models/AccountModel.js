const { query } = require('../config/database');

const profileTableSql = `
  CREATE TABLE IF NOT EXISTS usuario_perfil (
    id_usuario INT NOT NULL,
    avatar_url VARCHAR(255) DEFAULT NULL,
    avatar_color VARCHAR(20) DEFAULT '#B39237',
    telefono_alterno VARCHAR(20) DEFAULT NULL,
    extension VARCHAR(10) DEFAULT NULL,
    timezone VARCHAR(60) DEFAULT 'America/Bogota',
    bio VARCHAR(255) DEFAULT NULL,
    firma_digital VARCHAR(255) DEFAULT NULL,
    foto_actualizada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    CONSTRAINT fk_usuario_perfil_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

const profileColumns = [
  { name: 'avatar_url', definition: 'VARCHAR(255) DEFAULT NULL' },
  { name: 'avatar_color', definition: "VARCHAR(20) DEFAULT '#B39237'" },
  { name: 'telefono_alterno', definition: 'VARCHAR(20) DEFAULT NULL' },
  { name: 'extension', definition: 'VARCHAR(10) DEFAULT NULL' },
  { name: 'timezone', definition: "VARCHAR(60) DEFAULT 'America/Bogota'" },
  { name: 'bio', definition: 'VARCHAR(255) DEFAULT NULL' },
  { name: 'firma_digital', definition: 'VARCHAR(255) DEFAULT NULL' },
  { name: 'foto_actualizada_en', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
  { name: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
  { name: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
];

const preferencesTableSql = `
  CREATE TABLE IF NOT EXISTS usuario_preferencias (
    id_usuario INT NOT NULL,
    idioma VARCHAR(5) NOT NULL DEFAULT 'es',
    tema ENUM('claro','oscuro','sistema') NOT NULL DEFAULT 'sistema',
    notificar_email TINYINT(1) NOT NULL DEFAULT 1,
    notificar_push TINYINT(1) NOT NULL DEFAULT 0,
    notificar_inventario TINYINT(1) NOT NULL DEFAULT 1,
    notificar_ciclos TINYINT(1) NOT NULL DEFAULT 1,
    resumen_semanal TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario),
    CONSTRAINT fk_usuario_preferencias_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

const preferencesColumns = [
  { name: 'idioma', definition: "VARCHAR(5) NOT NULL DEFAULT 'es'" },
  { name: 'tema', definition: "ENUM('claro','oscuro','sistema') NOT NULL DEFAULT 'sistema'" },
  { name: 'notificar_email', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
  { name: 'notificar_push', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
  { name: 'notificar_inventario', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
  { name: 'notificar_ciclos', definition: 'TINYINT(1) NOT NULL DEFAULT 1' },
  { name: 'resumen_semanal', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
  { name: 'created_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
  { name: 'updated_at', definition: 'DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
];

const notificationsTableSql = `
  CREATE TABLE IF NOT EXISTS usuario_notificacion (
    id_notificacion INT NOT NULL AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    tipo ENUM('sistema','inventario','ciclo','alerta') NOT NULL DEFAULT 'sistema',
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    metadata JSON DEFAULT NULL,
    leido TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME DEFAULT NULL,
    PRIMARY KEY (id_notificacion),
    KEY idx_usuario_notificacion_usuario (id_usuario),
    KEY idx_usuario_notificacion_leido (leido),
    CONSTRAINT fk_usuario_notificacion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
`;

const notificationsColumns = [
  { name: 'tipo', definition: "ENUM('sistema','inventario','ciclo','alerta') NOT NULL DEFAULT 'sistema'" },
  { name: 'metadata', definition: 'JSON DEFAULT NULL' },
  { name: 'leido', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
  { name: 'created_at', definition: 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP' },
  { name: 'read_at', definition: 'DATETIME DEFAULT NULL' }
];

let accountSchemaReady = false;

const seedStatements = [
  `INSERT INTO usuario_preferencias (id_usuario)
    SELECT u.id_usuario FROM usuario u
    LEFT JOIN usuario_preferencias pref ON pref.id_usuario = u.id_usuario
    WHERE pref.id_usuario IS NULL`,
  `INSERT INTO usuario_perfil (id_usuario, avatar_color)
    SELECT u.id_usuario, '#B39237' FROM usuario u
    LEFT JOIN usuario_perfil perf ON perf.id_usuario = u.id_usuario
    WHERE perf.id_usuario IS NULL`,
  `INSERT INTO usuario_notificacion (id_usuario, tipo, titulo, mensaje)
    SELECT u.id_usuario, 'sistema', 'Bienvenido al Centro de Cuenta', 'Ahora puedes actualizar tu perfil, preferencias y configurar alertas personalizadas.'
    FROM usuario u
    LEFT JOIN usuario_notificacion n ON n.id_usuario = u.id_usuario AND n.titulo = 'Bienvenido al Centro de Cuenta'
    WHERE n.id_notificacion IS NULL`
];

async function columnExists(table, column) {
  const rows = await query(
    `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function ensureColumn(table, column, definition) {
  const exists = await columnExists(table, column);
  if (!exists) {
    await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function ensureAccountCenterSchema() {
  if (accountSchemaReady) {
    return;
  }
  try {
    await query(profileTableSql);
    for (const { name, definition } of profileColumns) {
      await ensureColumn('usuario_perfil', name, definition);
    }

    await query(preferencesTableSql);
    for (const { name, definition } of preferencesColumns) {
      await ensureColumn('usuario_preferencias', name, definition);
    }

    await query(notificationsTableSql);
    for (const { name, definition } of notificationsColumns) {
      await ensureColumn('usuario_notificacion', name, definition);
    }

    for (const seed of seedStatements) {
      await query(seed);
    }

    accountSchemaReady = true;
  } catch (error) {
    accountSchemaReady = false;
    console.error('Error asegurando el esquema del centro de cuenta:', error);
    throw error;
  }
}

class AccountModel {
  static async getAccountSummary(idUsuario) {
    await ensureAccountCenterSchema();
    const sql = `
      SELECT 
        u.id_usuario,
        u.username,
        u.email AS email_usuario,
        u.id_rol,
        r.nombre_rol,
        u.ultimo_acceso,
        e.id_empleado,
        e.nombre,
        e.apellido,
        e.cargo,
        e.telefono,
        e.email AS email_empleado,
        e.fecha_inicio,
        a.nombre_area,
        ub.nombre AS nombre_ubicacion,
        up.avatar_url,
        up.avatar_color,
        up.telefono_alterno,
        up.extension,
        up.timezone,
        up.bio,
        up.firma_digital,
        pref.idioma,
        pref.tema,
        pref.notificar_email,
        pref.notificar_push,
        pref.notificar_inventario,
        pref.notificar_ciclos,
        pref.resumen_semanal
      FROM usuario u
      INNER JOIN empleado e ON e.id_empleado = u.id_empleado
      LEFT JOIN rol r ON r.id_rol = u.id_rol
      LEFT JOIN area a ON a.id_area = e.id_area
      LEFT JOIN ubicacion ub ON ub.id_ubicacion = e.id_ubicacion
      LEFT JOIN usuario_perfil up ON up.id_usuario = u.id_usuario
      LEFT JOIN usuario_preferencias pref ON pref.id_usuario = u.id_usuario
      WHERE u.id_usuario = ?
      LIMIT 1
    `;

    const rows = await query(sql, [idUsuario]);
    const base = rows[0];
    if (!base) {
      return null;
    }

    const profile = {
      id_usuario: base.id_usuario,
      username: base.username,
      email: base.email_usuario,
      ultimo_acceso: base.ultimo_acceso,
      rol: base.nombre_rol,
      empleado: {
        id_empleado: base.id_empleado,
        nombre: base.nombre,
        apellido: base.apellido,
        cargo: base.cargo,
        telefono: base.telefono,
        email: base.email_empleado,
        fecha_inicio: base.fecha_inicio,
        area_nombre: base.nombre_area,
        ubicacion_nombre: base.nombre_ubicacion
      },
      customization: {
        avatar_url: base.avatar_url,
        avatar_color: base.avatar_color || '#B39237',
        telefono_alterno: base.telefono_alterno,
        extension: base.extension,
        timezone: base.timezone || 'America/Bogota',
        bio: base.bio,
        firma_digital: base.firma_digital
      }
    };

    const preferences = {
      idioma: base.idioma || 'es',
      tema: base.tema || 'sistema',
      notificar_email: base.notificar_email !== null ? Boolean(base.notificar_email) : true,
      notificar_push: base.notificar_push !== null ? Boolean(base.notificar_push) : false,
      notificar_inventario: base.notificar_inventario !== null ? Boolean(base.notificar_inventario) : true,
      notificar_ciclos: base.notificar_ciclos !== null ? Boolean(base.notificar_ciclos) : true,
      resumen_semanal: base.resumen_semanal !== null ? Boolean(base.resumen_semanal) : false
    };

    const snapshot = await this.getNotificationSnapshot(idUsuario);

    return {
      profile,
      preferences,
      notifications: snapshot
    };
  }

  static async getNotificationSnapshot(idUsuario) {
    await ensureAccountCenterSchema();
    const [stat] = await query(
      'SELECT COUNT(*) AS unread FROM usuario_notificacion WHERE id_usuario = ? AND leido = 0',
      [idUsuario]
    );

    const latest = await query(
      `SELECT id_notificacion, tipo, titulo, mensaje, leido, created_at
       FROM usuario_notificacion
       WHERE id_usuario = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [idUsuario]
    );

    return {
      unreadCount: stat?.unread || 0,
      latest
    };
  }

  static async upsertProfile(idUsuario, data) {
    await ensureAccountCenterSchema();
    const allowedFields = [
      'avatar_url',
      'avatar_color',
      'telefono_alterno',
      'extension',
      'timezone',
      'bio',
      'firma_digital'
    ];

    const columns = [];
    const values = [];
    const updates = [];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        columns.push(field);
        values.push(data[field]);
        updates.push(`${field} = VALUES(${field})`);
      }
    }

    if (columns.length === 0) {
      return this.getAccountSummary(idUsuario);
    }

    const sql = `
      INSERT INTO usuario_perfil (id_usuario, ${columns.join(', ')})
      VALUES (?, ${columns.map(() => '?').join(', ')})
      ON DUPLICATE KEY UPDATE ${updates.join(', ')}, updated_at = NOW()
    `;

    await query(sql, [idUsuario, ...values]);
    return this.getAccountSummary(idUsuario);
  }

  static async updateEmployeeContact(idUsuario, contact = {}) {
    const allowed = ['telefono'];
    const updates = [];
    const values = [];

    for (const field of allowed) {
      if (Object.prototype.hasOwnProperty.call(contact, field)) {
        updates.push(`${field} = ?`);
        values.push(contact[field]);
      }
    }

    if (updates.length === 0) {
      return false;
    }

    const sql = `
      UPDATE empleado e
      INNER JOIN usuario u ON u.id_empleado = e.id_empleado
      SET ${updates.join(', ')}
      WHERE u.id_usuario = ?
    `;

    await query(sql, [...values, idUsuario]);
    return true;
  }

  static async upsertPreferences(idUsuario, data) {
    await ensureAccountCenterSchema();
    const allowedFields = [
      'idioma',
      'tema',
      'notificar_email',
      'notificar_push',
      'notificar_inventario',
      'notificar_ciclos',
      'resumen_semanal'
    ];

    const columns = [];
    const values = [];
    const updates = [];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        columns.push(field);
        values.push(data[field]);
        updates.push(`${field} = VALUES(${field})`);
      }
    }

    if (columns.length === 0) {
      return this.getAccountSummary(idUsuario);
    }

    const sql = `
      INSERT INTO usuario_preferencias (id_usuario, ${columns.join(', ')})
      VALUES (?, ${columns.map(() => '?').join(', ')})
      ON DUPLICATE KEY UPDATE ${updates.join(', ')}, updated_at = NOW()
    `;

    await query(sql, [idUsuario, ...values]);
    return this.getAccountSummary(idUsuario);
  }

  static async getNotifications(idUsuario, { page = 1, pageSize = 10, filter = 'all' }) {
    await ensureAccountCenterSchema();
    const limit = Math.min(Math.max(Number(pageSize) || 10, 5), 50);
    const currentPage = Math.max(Number(page) || 1, 1);
    const offset = (currentPage - 1) * limit;

    const conditions = ['id_usuario = ?'];
    const params = [idUsuario];

    if (filter === 'read') {
      conditions.push('leido = 1');
    } else if (filter === 'unread') {
      conditions.push('leido = 0');
    }

    const where = conditions.join(' AND ');

    const items = await query(
      `SELECT id_notificacion, tipo, titulo, mensaje, metadata, leido, created_at, read_at
       FROM usuario_notificacion
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM usuario_notificacion WHERE ${where}`,
      params
    );

    const parsedItems = items.map((item) => ({
      ...item,
      metadata: item.metadata ? this.safeParseJson(item.metadata) : null
    }));

    return {
      items: parsedItems,
      pagination: {
        page: currentPage,
        pageSize: limit,
        total: countRow?.total || 0
      }
    };
  }

  static async markNotification(idUsuario, idNotificacion, read = true) {
    await ensureAccountCenterSchema();
    const sql = `
      UPDATE usuario_notificacion
      SET leido = ?, read_at = CASE WHEN ? = 1 THEN NOW() ELSE NULL END
      WHERE id_usuario = ? AND id_notificacion = ?
    `;
    const result = await query(sql, [read ? 1 : 0, read ? 1 : 0, idUsuario, idNotificacion]);
    return result.affectedRows > 0;
  }

  static async markAllNotifications(idUsuario) {
    await ensureAccountCenterSchema();
    const sql = `
      UPDATE usuario_notificacion
      SET leido = 1, read_at = NOW()
      WHERE id_usuario = ? AND leido = 0
    `;
    const result = await query(sql, [idUsuario]);
    return result.affectedRows || 0;
  }

  static async createNotification(idUsuario, payload) {
    await ensureAccountCenterSchema();
    const sql = `
      INSERT INTO usuario_notificacion (id_usuario, tipo, titulo, mensaje, metadata)
      VALUES (?, ?, ?, ?, ?)
    `;
    const metadata = payload.metadata ? JSON.stringify(payload.metadata) : null;
    const result = await query(sql, [
      idUsuario,
      payload.tipo || 'sistema',
      payload.titulo,
      payload.mensaje,
      metadata
    ]);
    return result.insertId;
  }

  static async getRawProfile(idUsuario) {
    await ensureAccountCenterSchema();
    const rows = await query('SELECT * FROM usuario_perfil WHERE id_usuario = ? LIMIT 1', [idUsuario]);
    return rows[0] || null;
  }

  static safeParseJson(value) {
    try {
      if (value === null || value === undefined) return null;
      if (typeof value === 'object') return value;
      return JSON.parse(value);
    } catch (_) {
      return null;
    }
  }
}

module.exports = AccountModel;
