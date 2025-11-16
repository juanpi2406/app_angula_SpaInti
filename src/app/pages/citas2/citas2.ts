import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

// Interfaz actualizada: ahora el nombre del servicio viene a través de la relación
interface UltimaCita {
  // servicio_id será un objeto con las propiedades de la tabla servicios
  servicio_id: {
    nombre: string; // <-- Asumo que el nombre legible está en servicios.nombre
  } | null;
  fecha_reserva: string;
  hora_reserva: string;
  notas: string;
}

@Component({
  selector: 'app-citas2',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './citas2.html',
  styleUrls: ['./citas2.css']
})
export class Citas2 implements OnInit {

  usuarioDisplay: string = '';
  nombre:string="";
  servicio: string = '';
  fecha: string = '';
  hora: string = '';
  notas: string = '';

  serviciosLista: any[] = [];
  recomendaciones: any[] = [];
  ultimaCita: UltimaCita | null = null;

  cargando = true; // indicador para el loader



  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
  }

  async ngOnInit() {
    this.cargando = true;
    this.cdr.detectChanges();

    await Promise.all([
        this.cargarServicios(),
        this.cargarUsuario()
    ]);

    await this.cargarUltimaCita();

    this.cargando = false;
    this.cdr.detectChanges();
  }

  // Carga servicios y prepara recomendaciones
 private async cargarServicios() {
  try {
    const { data, error } = await this.supabaseService.getServicios();
    if (error) {
      console.error('Error cargando servicios:', error);
      this.serviciosLista = [];
    } else {
      this.serviciosLista = data || [];

      // -----------------------------
      // NUEVA LÓGICA DE SERVICIOS ALEATORIOS (4 MÁXIMO)
      // -----------------------------
      const mezclados = [...this.serviciosLista].sort(() => Math.random() - 0.5);
      this.recomendaciones = mezclados.slice(0, 4);

      console.log('Servicios recomendados (aleatorios):', this.recomendaciones);
    }
  } catch (err) {
    console.error('Excepción en cargarServicios:', err);
    this.serviciosLista = [];
    this.recomendaciones = [];
  }
  this.cdr.detectChanges();
}


  // Carga la última cita del usuario, incluyendo el nombre del servicio
  private async cargarUltimaCita() {
    try {
      const { data: userData } = await this.supabaseService.getUser();
      const authUserId = userData?.user?.id;

      if (!authUserId) {
        this.ultimaCita = null;
        return;
      }

      // 1. OBTENER EL CLIENTE_ID (BIGINT)
      const { data: clienteData, error: clienteError } = await this.supabaseService.client
        .from('clientes')
        .select('cliente_id')
        .eq('auth_user_id', authUserId)
        .single();

      if (clienteError || !clienteData) {
        this.ultimaCita = null;
        return;
      }

      const clienteId = clienteData.cliente_id;
      console.log('Cliente ID encontrado:', clienteId);

      // 2. BUSCAR LA ÚLTIMA CITA Y TRAER LA RELACIÓN (JOIN)
      // Usamos 'servicio_id(nombre)' para traer el nombre del servicio de la tabla 'servicios'

      const { data, error } = await this.supabaseService.client
        .from('reservas')
        .select('*, servicio_id(nombre)') // <-- CAMBIO CLAVE:  el JOIN
        .eq('cliente_id', clienteId)
        .order('fecha_reserva', { ascending: false })
        .order('hora_reserva', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error al obtener última cita:', error);
        this.ultimaCita = null;
      } else {
        // La propiedad 'servicio_id' ahora es un objeto que contiene el nombre.
        this.ultimaCita = data ? (data as UltimaCita) : null;
        console.log('Última cita cargada (OBJETO COMPLETO CON JOIN):', this.ultimaCita);
      }

    } catch (err) {
      console.error('Excepción en cargarUltimaCita:', err);
      this.ultimaCita = null;
    }
    this.cdr.detectChanges();
  }


  // Crear Cita - **CORRECCIÓN: Debe usar el valor numérico (ID) del servicio**
  async crearCita2() {
    const { data: userData } = await this.supabaseService.getUser();
    const authUserId = userData?.user?.id;

    if (!authUserId) {
      console.error('No hay usuario autenticado ');
      return;
    }

    // El formulario (this.servicio) devuelve el NOMBRE.
    // Necesitamos buscar el ID numérico antes de insertarlo.
    const servicioSeleccionado = this.serviciosLista.find(s => s.nombre === this.servicio);

    if (!servicioSeleccionado) {
        console.error('Por favor, selecciona un servicio válido.');
        return;
    }
    const servicioIdNumerico = servicioSeleccionado.id; // Asumo que la columna de ID es 'id'

    // --- LÓGICA DE TRADUCCIÓN DE ID (UUID -> BIGINT) ---
    const { data: clienteData, error: clienteError } = await this.supabaseService.client
        .from('clientes')
        .select('cliente_id')
        .eq('auth_user_id', authUserId)
        .single();

    if (clienteError || !clienteData) {
        console.error('No se encontró el cliente asociado para crear la cita.');
        return;
    }
    const clienteId = clienteData.cliente_id;
    // --- FIN DE LÓGICA DE TRADUCCIÓN DE ID ---

    const { data, error } = await this.supabaseService.client
      .from('reservas')
      .insert({
        cliente_id: clienteId,
        servicio_id: servicioIdNumerico, // CORREGIDO: Usamos el ID numérico
        fecha_reserva: this.fecha,
        hora_reserva: this.hora,
        notas: this.notas
      });

    if (error) {
      console.error('Error al crear cita: ' + error.message);
      return;
    }

    console.log('Cita creada');
    this.servicio = this.fecha = this.hora = this.notas = '';

    await this.cargarUltimaCita();
  }

  seleccionarRecomendado(r: any) {
    // Aquí asignamos el NOMBRE, que luego se usa en crearCita2 para buscar el ID.
    this.servicio = r.nombre;
    console.log('Servicio seleccionado:', this.servicio);
    this.cdr.detectChanges();
  }



async cargarUsuario() {
  const { data: { user }, error: userError } = await this.supabaseService.client.auth.getUser();

  if (userError || !user) {
    this.usuarioDisplay = 'Iniciar Sesión';
    this.nombre = '';
    return;
  }

  // Guardar el correo en usuarioDisplay
  this.usuarioDisplay = user.email || 'Usuario';

  // Buscar nombre y apellido del cliente
  const { data: clienteData, error: clienteError } = await this.supabaseService.client
    .from('clientes')
    .select('nombres, apellidos')
    .eq('auth_user_id', user.id)
    .single();

  if (clienteError || !clienteData) {
    this.nombre = '';
    return;
  }

  // Guardar nombre completo en variable nombre
  this.nombre = `${clienteData.nombres} ${clienteData.apellidos}`;
}
  abrirPerfil() {
    console.log('Botón de usuario clickeado');
  }
// Navegación de vuelta
  irAtras() {
    this.router.navigate(['/reservar-cita']);
  }
    irLogin() {
    this.router.navigate(['/login']);
  }
   irInicio() {
    this.router.navigate(['/citas2']);
  }
    irReservarCita() {
    this.router.navigate(['/reservar-cita']);
  }
     irCitasPorServicio() {
    this.router.navigate(['/citas-por-servicio']);
  }
      irCitasPorEspecialista() {
    this.router.navigate(['/citas-por-especialista']);
  }
}



