import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Citas2 } from './citas2';

describe('Citas2', () => {
  let component: Citas2;
  let fixture: ComponentFixture<Citas2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Citas2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Citas2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
