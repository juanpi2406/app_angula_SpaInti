import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Importamos DatePipe aquí
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { NgIf, NgFor, NgClass } from '@angular/common';

// Interfaz que define la estructura de una cita con los datos relacionados (joins)
interface Reserva {
  reserva_id: number;
  fecha_reserva: string;
  hora_reserva: string;
  estado: string;
  // Propiedades obtenidas a través de la relación (join)
  empleado_id: { nombres: string; apellidos: string };
  servicio_id: { nombre: string };
}

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  styleUrls: ['./mis-citas.component.css'],

  // Usamos los módulos necesarios, incluyendo DatePipe para el formato de fecha
  imports: [CommonModule, NgIf, NgFor, NgClass, DatePipe],
  template: `
    <div class="citas-container">
      <div class="header">
        <h1>Mis Próximas Citas</h1>
      </div>

      <!-- Indicador de Carga -->
      <div *ngIf="cargando" class="loader-overlay">
        <div class="spinner"></div>
        <span>Buscando tus próximas citas...</span>
      </div>

      <!-- Mensaje si no hay citas -->
      <div *ngIf="!cargando && citas.length === 0" class="no-citas">
        <p class="font-bold text-xl mb-2">¡Todo listo!</p>
        <p>Parece que no tienes citas activas. Es un buen momento para agendar tu próximo servicio.</p>
        <button (click)="irAReservar()" class="btn-reservar">
          Reservar Cita Ahora
        </button>
      </div>

      <!-- Lista de Citas -->
      <div class="citas-grid" *ngIf="!cargando && citas.length > 0">
        <div *ngFor="let cita of citas"
             class="cita-card"
             [ngClass]="{'estado-confirmada': cita.estado === 'confirmada',
                         'estado-pendiente': cita.estado === 'pendiente',
                         'estado-cancelada': cita.estado === 'cancelada'}">

          <!-- Título del Servicio -->
          <h2 class="servicio-nombre">{{ cita.servicio_id.nombre }}</h2>

          <!-- Metadatos de la Cita (Fecha, Hora, Empleado) -->
          <div class="cita-metadatos">

            <div class="cita-detalle">
              <!-- Icono de Calendario (Date) -->
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span class="font-medium">Fecha:</span>
              <span class="fecha-badge">{{ cita.fecha_reserva | date: 'fullDate' }}</span>
            </div>

            <div class="cita-detalle">
              <!-- Icono de Reloj (Time) -->
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span class="font-medium">Hora:</span>
              <span class="hora-badge">{{ cita.hora_reserva.substring(0, 5) }}</span>
            </div>

            <div class="cita-detalle">
              <!-- Icono de Persona (Specialist) -->
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span class="font-medium">Especialista:</span>
              <span class="ml-2">{{ cita.empleado_id.nombres }} {{ cita.empleado_id.apellidos }}</span>
            </div>

          </div>

          <!-- Etiqueta de Estado y Botón de Acción -->
          <div class="cita-acciones">
            <span class="estado-tag"
                  [ngClass]="{'confirmada': cita.estado === 'confirmada',
                              'pendiente': cita.estado === 'pendiente',
                              'cancelada': cita.estado === 'cancelada'}">
              {{ cita.estado | uppercase }}
            </span>

            <!-- Botón de Anular -->
            <button *ngIf="cita.estado === 'pendiente' || cita.estado === 'confirmada'"
                    (click)="anularCita(cita)"
                    class="btn-anular">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Anular
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  // Los estilos han sido movidos aquí para hacer el componente autocontenido.


})
export class MisCitasComponent implements OnInit {

  citas: Reserva[] = [];
  cargando: boolean = true;
  clienteId: number | null = null;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.obtenerClienteId();
    if (this.clienteId) {
      console.log(`[DIAGNÓSTICO] Cliente ID encontrado: ${this.clienteId}. Procediendo a cargar citas.`);
      await this.cargarCitas();
    } else {
      this.cargando = false;
      console.warn("[DIAGNÓSTICO] No se pudo obtener el ID del cliente. Verifica la autenticación o la tabla 'clientes'.");
    }
  }

  irAReservar() {
    this.router.navigate(['/reservar-cita']);
  }

  async obtenerClienteId() {
    this.cargando = true;
    try {
      const { data: { user } } = await this.supabase.client.auth.getUser();

      if (!user) {
        console.warn("[DIAGNÓSTICO] Usuario no autenticado. Redirigiendo a /login.");
        this.router.navigate(['/login']);
        return;
      }

      const authUserId = user.id;
      console.log(`[DIAGNÓSTICO] Usuario autenticado ID: ${authUserId}`);

      const { data: clienteData, error } = await this.supabase.client
        .from('clientes')
        .select('cliente_id')
        .eq('auth_user_id', authUserId)
        .single();

      if (error || !clienteData) {
        console.error("[DIAGNÓSTICO] ERROR al buscar cliente ID o cliente no encontrado en la tabla 'clientes'.", error);
        this.clienteId = null;
      } else {
        this.clienteId = clienteData.cliente_id;
      }

    } catch (err) {
      console.error("[DIAGNÓSTICO] Error general al obtener cliente ID:", err);
      this.clienteId = null;
    }
  }

  async cargarCitas() {
    if (!this.clienteId) {
      this.cargando = false;
      return;
    }

    try {
      const { data, error } = await this.supabase.client
        .from('reservas')
        .select(`
          reserva_id,
          fecha_reserva,
          hora_reserva,
          estado,
          empleado_id (nombres, apellidos),
          servicio_id (nombre)
        `)
        .eq('cliente_id', this.clienteId)
        .neq('estado', 'cancelada')
        .order('fecha_reserva', { ascending: true })
        .order('hora_reserva', { ascending: true });

      if (error) {
        console.error("[DIAGNÓSTICO] ERROR cargando citas de la tabla 'reservas':", error);
        this.citas = [];
      } else {
        this.citas = (data as any) as Reserva[];
        console.log(`[DIAGNÓSTICO] Citas cargadas con éxito. Cantidad: ${this.citas.length}`, this.citas);
      }
    } catch (err) {
      console.error("[DIAGNÓSTICO] Excepción al cargar citas:", err);
      this.citas = [];
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  async anularCita(cita: Reserva) {
    // Nota: Se utiliza la función nativa `confirm` como se especificó previamente, aunque en un entorno real se usaría un modal personalizado.
    if (!confirm(`¿Estás seguro de que deseas ANULAR la cita para ${cita.servicio_id.nombre} el ${cita.fecha_reserva} a las ${cita.hora_reserva.substring(0, 5)}? Esta acción no se puede deshacer.`)) return;

    try {
      const { error: reservaError } = await this.supabase.client
        .from('reservas')
        .update({ estado: 'cancelada' })
        .eq('reserva_id', cita.reserva_id);

      if (reservaError) {
        // Nota: Se utiliza la función nativa `alert` como se especificó previamente, aunque en un entorno real se usaría un modal personalizado.
        alert("❌ Error al anular la cita. Por favor, inténtalo de nuevo.");
        console.error("Error al anular reserva:", reservaError);
        return;
      }

      // Nota: Se utiliza la función nativa `alert` como se especificó previamente.
      alert("✅ ¡Cita anulada con éxito! Tu lista se actualizará.");
      await this.cargarCitas(); // Recargar la lista para actualizar la vista

    } catch (e) {
      console.error("Excepción al anular cita:", e);
      alert("Ocurrió un error inesperado al anular la cita.");
    }
  }

}
