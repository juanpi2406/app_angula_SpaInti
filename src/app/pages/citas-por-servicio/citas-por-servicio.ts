import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router'; // Importar Router

@Component({
  selector: 'app-citas-por-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './citas-por-servicio.html',
  styleUrls: ['./citas-por-servicio.css']
})
export class CitasPorServicioComponent implements OnInit {

  servicios: any[] = [];
  empleadosDelServicio: any[] = [];

  servicioSeleccionado: any = null;
  fechaSeleccionada: string = '';

  // Cambiado: ahora es un OBJETO, no string
  horaSeleccionada: any = null;
  empleadoSeleccionado: number = 0;

  cargandoHorarios = false;

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.cargarServicios();
  }

  // ✔ Traer servicios
  async cargarServicios() {
    const { data } = await this.supabase.client
      .from('servicios')
      .select('*')
      .order('nombre', { ascending: true });

    this.servicios = data || [];
    this.cdr.detectChanges();
  }

  // ✔ Al seleccionar servicio
  async seleccionarServicio(servicio: any) {
    this.servicioSeleccionado = servicio;
    this.fechaSeleccionada = '';
    this.horaSeleccionada = null;
    this.empleadoSeleccionado = 0;
    this.empleadosDelServicio = [];

    // Obtener empleados asignados al servicio
    const { data, error } = await this.supabase.client
      .from('servicios_empleados')
      .select('empleado_id')
      .eq('servicio_id', servicio.servicio_id);

    if (error) {
      console.error('❌ Error obteniendo empleados:', error);
      return;
    }

    const ids = data?.map(x => x.empleado_id) || [];

    if (ids.length === 0) {
      this.empleadosDelServicio = [];
      this.cdr.detectChanges();
      return;
    }

    // Traer datos completos de esos empleados
    const { data: empleados } = await this.supabase.client
      .from('empleados')
      .select('*')
      .in('empleado_id', ids);

    this.empleadosDelServicio = empleados?.map(e => ({
      ...e,
      horarios: []
    })) || [];

    this.cdr.detectChanges();
  }

  // ✔ Buscar horarios POR empleado
  async buscarHorariosPorServicio() {
    if (!this.fechaSeleccionada) return;
      // ❗ REINICIAR HORARIOS
  this.empleadosDelServicio.forEach(e => e.horarios = []);
    this.cargandoHorarios = true;
    this.cdr.detectChanges();

for (let emp of this.empleadosDelServicio) {
  const { data: horarios } = await this.supabase.client
    .from('horarios_empleados')
    .select('*')
    .eq('empleado_id', emp.empleado_id)
    .eq('fecha', this.fechaSeleccionada)
    .eq('disponible', true);

  const { data: reservas } = await this.supabase.client
    .from('citas2')
    .select('hora')
    .eq('fecha', this.fechaSeleccionada)
    .eq('empleado_id', emp.empleado_id)
    .eq('servicio_id', this.servicioSeleccionado.servicio_id);

  const horasReservadas = reservas?.map(r => r.hora) || [];

  emp.horarios = (horarios || []).filter(
    h => !horasReservadas.includes(h.hora)
  );
}


    this.cargandoHorarios = false;
    this.cdr.detectChanges();
  }

  // ✔ Al seleccionar hora
seleccionarHora(horario: any, empleado_id: number) {
  this.horaSeleccionada = {
    empleado_id,
    hora: horario.hora
  };
}

confirmarReserva() {
  if (!this.servicioSeleccionado || !this.fechaSeleccionada || !this.horaSeleccionada) {
    alert("Selecciona servicio, fecha y horario");
    return;
  }

  this.mostrarResumen = true;
}



  // ✔ Confirmar Reserva
async enviarReserva() {
  if (!this.servicioSeleccionado || !this.fechaSeleccionada || !this.horaSeleccionada) {
    alert("Selecciona servicio, fecha y horario");
    return;
  }

  try {
    // 1. Obtener el usuario logueado
    const { data: { user }, error: userError } = await this.supabase.client.auth.getUser();

    if (userError || !user) {
      alert("No se pudo obtener el usuario logueado.");
      return;
    }

    // 2. Buscar el cliente asociado al usuario
    const { data: clienteData, error: clienteError } = await this.supabase.client
      .from('clientes')
      .select('cliente_id')
      .eq('auth_user_id', user.id)
      .single();

    if (clienteError || !clienteData) {
      alert("No se encontró un cliente asociado a este usuario.");
      return;
    }

    const clienteId = clienteData.cliente_id;
    const empleadoId = this.horaSeleccionada.empleado_id;
    const servicioId = this.servicioSeleccionado.servicio_id;
    const fecha = this.fechaSeleccionada;
    const hora = this.horaSeleccionada.hora;

    // 3. Verificar y bloquear el horario
    const { data: horario, error: horarioError } = await this.supabase.client
      .from('horarios_empleados')
      .select('id, disponible')
      .eq('empleado_id', empleadoId)
      .eq('fecha', fecha)
      .eq('hora', hora)
      .single();

    if (horarioError || !horario) {
      alert("No se encontró el horario seleccionado.");
      return;
    }

    if (!horario.disponible) {
      alert("Este horario ya fue reservado. Actualiza la página.");
      return;
    }

    const { error: updateError } = await this.supabase.client
      .from('horarios_empleados')
      .update({ disponible: false })
      .eq('id', horario.id);

    if (updateError) {
      console.error("Error al actualizar horario:", updateError.message);
      return;
    }

    // 4. Insertar en reservas
    const { data: reservaInsertada, error: reservaError } = await this.supabase.client
      .from('reservas')
      .insert([{
        cliente_id: clienteId,
        empleado_id: empleadoId,
        servicio_id: servicioId,
        fecha_reserva: fecha,
        hora_reserva: hora,
        estado: 'pendiente'
      }])
      .select()
      .single();

    if (reservaError || !reservaInsertada) {
      console.error("Error al insertar en reservas:", reservaError);
      return;
    }

    // 5. Insertar en historial_reserva
    const { error: historialError } = await this.supabase.client
      .from('historial_reserva')
      .insert([{
        reserva_id: reservaInsertada.reserva_id,
        estado: 'pendiente',
        fecha_estado: new Date().toISOString()
      }]);

    if (historialError) {
      console.error("Error al insertar en historial_reserva:", historialError);
    }

    // 6. Finalizar
    alert("Cita reservada con éxito");


    this.horaSeleccionada = null;
    this.empleadoSeleccionado = 0;
    this.mostrarResumen = false;
    await this.buscarHorariosPorServicio();
    // ¡Redireccionamiento al nuevo componente de lista!
    this.router.navigate(['/mis-citas']);

  } catch (err: any) {
    console.error('Excepción en enviarReserva:', err);
    alert('Ocurrió un error al reservar la cita.');
  }
}

get noHayHorarios(): boolean {
  return (
    !this.cargandoHorarios &&
    this.empleadosDelServicio.length > 0 &&
    this.empleadosDelServicio.every(emp =>
      !emp.horarios || emp.horarios.length === 0
    )
  );
}

mostrarResumen = false;

get especialistaSeleccionado() {
  if (!this.horaSeleccionada) return null;
  return this.empleadosDelServicio.find(e => e.empleado_id === this.horaSeleccionada.empleado_id) || null;
}




}
