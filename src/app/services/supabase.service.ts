import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://hvmfevjfkoeevcztjugd.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bWZldmpma29lZXZjenRqdWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NDQzMjcsImV4cCI6MjA3ODIyMDMyN30.nk9TJMF-0qqbz_7MF8MAh5HxMd6KR0bB1kbeiMR_1xM'
);
  }

  get client() {
    return this.supabase;
  }

  async signUp(email: string, password: string) {
    return await this.supabase.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async getUser() {
    return await this.supabase.auth.getUser();
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

async getServicios() {
  return await this.client
    .from('servicios')
    .select('servicio_id, nombre, precio, imagen_url');
}

async signInWithEmail(email: string, password: string) {
  return await this.client.auth.signInWithPassword({
    email,
    password
  });
}

// Obtener horarios disponibles por especialista y fecha
async getHorariosDisponibles(empleadoId: number, fecha: string) {
  return this.supabase
    .from('horarios_empleados')
    .select('*')
    .eq('empleado_id', empleadoId)
    .eq('fecha', fecha)
    .eq('disponible', true)
    .order('hora');
}

// Registrar una reserva
async crearReserva(data: {
  cliente_id: number;
  servicio_id: number;
  empleado_id: number;
  fecha_reserva: string;
  hora_reserva: string;
  estado: string;
}) {
  return this.supabase.from('reservas').insert([data]);
}

// Bloquear horario
async bloquearHorario(empleadoId: number, fecha: string, hora: string) {
  return this.supabase
    .from('horarios_empleados')
    .update({ disponible: false })
    .eq('empleado_id', empleadoId)
    .eq('fecha', fecha)
    .eq('hora', hora);
}








}
