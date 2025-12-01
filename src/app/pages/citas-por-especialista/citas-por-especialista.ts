import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-citas-por-especialista',
  standalone: true,
  // Asegúrate de que los módulos estén en el array de imports si usas Angular 17+
  imports: [CommonModule, FormsModule],
  templateUrl: './citas-por-especialista.html',
  styleUrls: ['./citas-por-especialista.css']
})
export class CitasPorEspecialistaComponent implements OnInit {

  empleados: any[] = [];
  // Usamos string porque el valor del <select> es string, y lo convertimos a number en la consulta
  empleadoSeleccionado: string = '';

  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';

  horarios: any[] = [];
  cargandoHorarios = false;

  // Asumo que el servicio es implícito en este componente o está fijo:
  // Si tienes un input de servicio en el HTML, esta línea debe cambiar.
  servicioIdFijo: number = 1; // ⚠️ Si este ID es dinámico, debe obtenerse del input/selección.

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef, // ⬅️ Inyectamos ChangeDetectorRef
    private router: Router // ⬅️ Inyectamos Router
  ) {}

  async ngOnInit() {
    await this.cargarEmpleados();

    // 1. Inicializar la fecha con la fecha de hoy (formato YYYY-MM-DD)
    const today = new Date();
    // this.fechaSeleccionada = today.toISOString().split('T')[0];

    // 2. Inicializar el empleado seleccionado y cargar horarios
    if (this.empleados.length > 0) {
      // Seleccionar el ID del primer empleado (que es string en this.empleadoSeleccionado)
      // this.empleadoSeleccionado = String(this.empleados[0].empleado_id);

      // 3. Forzar la primera carga de horarios al inicio
      await this.cargarHorarios();
    }

    // Forzar la detección de cambios al final de la inicialización
    this.cdr.detectChanges();
  }

  // 🔹 CARGAR EMPLEADOS
  async cargarEmpleados() {
    const { data, error } = await this.supabase.client
      .from('empleados')
      .select('empleado_id, nombres, apellidos');

    if (error) {
      console.error('Error cargando empleados:', error);
      return;
    }

    this.empleados = data || [];
    this.cdr.detectChanges(); // Forzar actualización de la lista de empleados
  }

  // 🔹 Cargar horarios disponibles
  async cargarHorarios() {
    if (!this.empleadoSeleccionado || !this.fechaSeleccionada) return;

    this.cargandoHorarios = true;
    this.horarios = [];
    this.cdr.detectChanges(); // Muestra el loader 'Cargando horarios...'

    // ⚠️ Nota: Tu consulta a 'citas2' en el método anterior debe ser 'reservas'.
    // He eliminado esa parte ya que la lógica solo debe cargar los horarios marcados como disponible: true

    const { data, error } = await this.supabase.client
      .from('horarios_empleados')
      .select('*')
      // ✅ CORRECCIÓN FINAL: Usamos 'empleado_id' y convertimos a número
      .eq('empleado_id', Number(this.empleadoSeleccionado))
      .eq('fecha', this.fechaSeleccionada)
      .eq('disponible', true) // Solo horarios disponibles
      .order('hora', { ascending: true });

    if (error) {
      console.error('Error cargando horarios:', error);
      this.cargandoHorarios = false;
      this.cdr.detectChanges();
      return;
    }

    this.horarios = data || [];
    this.cargandoHorarios = false;

    // 🚀 Acelera la visualización de los horarios
    this.cdr.detectChanges();
  }

  // 🔹 Seleccionar hora
  seleccionarHora(hora: string) {
    this.horaSeleccionada = hora;
    this.cdr.detectChanges(); // Asegura que el estado 'seleccionado' se actualice visualmente
  }

  // 🔹 Cancelar selección
  cancelarSeleccion() {
    this.horaSeleccionada = '';
    this.cdr.detectChanges();
  }

  confirmarReserva() {
    if (!this.empleadoSeleccionado || !this.fechaSeleccionada || !this.horaSeleccionada) {
      alert("Selecciona especialista, fecha y horario");
      return;
    }
    this.mostrarResumen = true;
  }

  // 🔹 Confirmar reserva
  async enviarReserva() {
    if (!this.empleadoSeleccionado || !this.fechaSeleccionada || !this.horaSeleccionada) {
      console.error("Faltan datos para reservar");
      return;
    }

    try {
      // ----------------------------------------------------
      // ✅ PASO 1 y 2: OBTENER CLIENTE ID A PARTIR DEL USUARIO AUTENTICADO
      // ----------------------------------------------------
      const { data: { user }, error: userError } = await this.supabase.client.auth.getUser();

      if (userError || !user) {
        alert("No se pudo obtener el usuario logueado. Por favor, inicia sesión.");
        return;
      }

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
      const empleadoId = Number(this.empleadoSeleccionado);
      const servicioId = this.servicioIdFijo; // Usamos la variable de la clase
      const fecha = this.fechaSeleccionada;
      const hora = this.horaSeleccionada;

      // ----------------------------------------------------
      // PASO 3: Verificar y bloquear el horario
      // ----------------------------------------------------
      const { data: horario, error: horarioError } = await this.supabase.client
        .from('horarios_empleados')
        .select('id, disponible')
        .eq('empleado_id', empleadoId)
        .eq('fecha', fecha)
        .eq('hora', hora)
        .single();

      if (horarioError || !horario || !horario.disponible) {
        alert("Este horario ya no está disponible. Actualiza la página.");
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

      // ----------------------------------------------------
      // PASO 4: Insertar en reservas (USANDO EL CLIENTE ID REAL)
      // ----------------------------------------------------
      const { data: reservaInsertada, error: reservaError } = await this.supabase.client
        .from('reservas')
        .insert([{
          cliente_id: clienteId, // ¡CLIENTE ID CORREGIDO!
          empleado_id: empleadoId,
          servicio_id: servicioId,
          fecha_reserva: fecha,
          hora_reserva: hora,
          estado: 'pendiente'
        }])
        .select()
        .single();

      if (reservaError || !reservaInsertada) {
        console.error("❌ Error al insertar en reservas:", reservaError);
        return;
      }

      // ----------------------------------------------------
      // PASO 5: Insertar en historial_reserva
      // ----------------------------------------------------
      const { error: historialError } = await this.supabase.client
        .from('historial_reserva')
        .insert([{
          reserva_id: reservaInsertada.reserva_id,
          estado: 'pendiente',
          fecha_estado: new Date().toISOString()
        }]);

      if (historialError) {
        console.error("❌ Error al insertar en historial_reserva:", historialError);
      }

      // ----------------------------------------------------
      // PASO 6: Finalizar y Redirigir
      // ----------------------------------------------------
      alert("✅ Cita reservada con éxito");

      this.horaSeleccionada = "";
      this.mostrarResumen = false;
      // No recargamos horarios porque redirigiremos

      // ¡Redireccionamiento al nuevo componente de lista!
      this.router.navigate(['/mis-citas']);

    } catch (err: any) {
      console.error('Excepción en enviarReserva:', err);
      alert('Ocurrió un error al reservar la cita.');
    }
  }

  // ... (getters y otros métodos)

  mostrarResumen = false;

  get especialistaSeleccionado() {
    return this.empleados.find(e => e.empleado_id === Number(this.empleadoSeleccionado)) || null;
  }

  // 🔹 Métodos de Navegación (Router)
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
    this.router.navigate(['/citas']);
  }
}
