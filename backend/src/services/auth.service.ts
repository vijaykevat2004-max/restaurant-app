import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../services/supabase-admin.js';
import { config } from '../config/index.js';
import { JwtPayload } from '../types/index.js';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  }

  static async login(email: string, password: string) {
    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('*, restaurant:Restaurant(*), branch:Branch(*)')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await this.comparePassword(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const tokenPayload: JwtPayload = {
      userId: user.id,
      restaurantId: user.restaurantId,
      branchId: user.branchId,
      role: user.role as JwtPayload['role'],
    };

    const token = this.generateToken(tokenPayload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        restaurantId: user.restaurantId,
        restaurantName: user.restaurant?.name,
        branchId: user.branchId,
        branchName: user.branch?.name,
      },
    };
  }

  static async register(
    email: string,
    password: string,
    name: string,
    restaurantId: string,
    role: string = 'STAFF',
    branchId?: string
  ) {
    const { data: existingUser } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await this.hashPassword(password);

    const { data: user, error } = await supabaseAdmin
      .from('User')
      .insert({
        email,
        passwordHash,
        name,
        role,
        restaurantId,
        branchId,
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to create user: ' + error.message);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurantId,
      branchId: user.branchId,
    };
  }

  static async getUserById(userId: string) {
    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('*, restaurant:Restaurant(*), branch:Branch(*)')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurantName: user.restaurant?.name,
      branchId: user.branchId,
      branchName: user.branch?.name,
    };
  }
}
