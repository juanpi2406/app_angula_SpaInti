import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { Citas } from './pages/citas/citas';
import { Citas2 } from './pages/citas2/citas2';
import { CitasOpciones } from './pages/citas-opciones/citas-opciones';
import { CitasPorServicioComponent } from './pages/citas-por-servicio/citas-por-servicio';
import { CitasPorEspecialistaComponent } from './pages/citas-por-especialista/citas-por-especialista';
import { DashboardLayoutComponent } from './pages/layaot/dashboard-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Rutas públicas
  { path: 'login', component: Login },
  { path: 'register', component: RegisterComponent },

  // Rutas protegidas bajo layout
  {
    path: '',
    component: DashboardLayoutComponent,
    children: [
      { path: 'citas', component: Citas },
      { path: 'citas2', component: Citas2 },
      { path: 'reservar-cita', component: CitasOpciones },
      { path: 'citas-por-servicio', component: CitasPorServicioComponent },
      { path: 'citas-por-especialista', component: CitasPorEspecialistaComponent },

    ]
  }
];
