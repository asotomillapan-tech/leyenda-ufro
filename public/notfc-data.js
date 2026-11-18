// =========================================================================
// BASE DE DATOS Y PARSER GOOGLE SHEETS · NOT F.C (MODO CARRERA DT UFRO)
// =========================================================================

export const DEFAULT_NOTFC_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYhD72gP7j64pCvF6L6el4Q5S0fsuXhHraTPoNsTnKG7EL1W7Vp4kWY6QLRGthOpbu4SXMKZvyu-gr/pubhtml';

export const CARRERAS_UFRO = [
  'Agronomía',
  'Bioquímica',
  'Biotecnología',
  'Contador Público y Auditor',
  'Derecho',
  'Enfermería',
  'Fonoaudiología',
  'Ingeniería Civil (Plan Común)',
  'Ingeniería Civil Ambiental',
  'Ingeniería Civil Electrónica',
  'Ingeniería Civil Eléctrica',
  'Ingeniería Civil Física',
  'Ingeniería Civil Industrial',
  'Ingeniería Civil Informática',
  'Ingeniería Civil Matemática',
  'Ingeniería Civil Mecánica',
  'Ingeniería Civil Química',
  'Ingeniería Civil Telemática',
  'Ingeniería Civil en Biotecnología',
  'Ingeniería Comercial',
  'Ingeniería en Construcción',
  'Ingeniería en Recursos Naturales',
  'Kinesiología',
  'Medicina',
  'Medicina Veterinaria',
  'Nutrición y Dietética',
  'Obstetricia y Puericultura',
  'Odontología',
  'Pedagogía en Castellano y Comunicación',
  'Pedagogía en Ciencias mención Biología, Química o Física',
  'Pedagogía en Educación Diferencial',
  'Pedagogía en Educación Física, Deportes y Recreación',
  'Pedagogía en Historia, Geografía y Educación Cívica',
  'Pedagogía en Inglés',
  'Pedagogía en Matemática',
  'Periodismo',
  'Psicología',
  'Química y Farmacia',
  'Sociología',
  'Tecnología Médica',
  'Terapia Ocupacional',
  'Trabajo Social',
];

export const SEED_UFRO_TEAMS = [
  // 1ª DIVISIÓN (19 EQUIPOS)
  { id: 'FECSH-EFI-01', name: 'Real Efineza', career: 'Pedagogía en Educación Física, Deportes y Recreación', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 1, baseOvr: 82, achievements: 'Campeones 2da División x1', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzUwMjAwX3JlYWxfZWZpbmV6YS5qcGciLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MjAwLCJoZWlnaHQiOjIwMCwiZml0IjoiY292ZXIifX19', derby: 'FECSH-EFI-02' },
  { id: 'MED-KIN-01', name: 'Club Atletico Kineiro', career: 'Kinesiología', faculty: 'Facultad de Medicina', division: 1, baseOvr: 81, achievements: 'Subcampeones 1era División x1', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzUyNjI4X3Jlc19hdGxldGljb19raW5laXJvXy5wbmciLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MjAwLCJoZWlnaHQiOjIwMCwiZml0IjoiY292ZXIifX19', derby: 'MED-KIN-02' },
  { id: 'FCJE-ICO-01', name: 'Comercial United', career: 'Ingeniería Comercial', faculty: 'Facultad de Ciencias Jurídicas y Empresariales', division: 1, baseOvr: 80, achievements: 'Campeones 1era División x1', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzc3NTk3X2NvbWVucmNpYWxfdW5pdGVkLmpwZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: 'FCJE-ICO-02' },
  { id: 'ODO-ODO-01', name: 'CA Bucal Juniors', career: 'Odontología', faculty: 'Facultad de Odontología', division: 1, baseOvr: 79, achievements: 'Campeones 2da x1', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzQ5NDdfYnVjYWxfanVuaW9ycy5qcGciLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MjAwLCJoZWlnaHQiOjIwMCwiZml0IjoiY292ZXIifX19', derby: '' },
  { id: 'FICA-IND-02', name: 'INDU-FU', career: 'Ingeniería Civil Industrial', faculty: 'Facultad de Ingeniería y Ciencias', division: 1, baseOvr: 79, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzc2MDE5X3Jlc19pbmR1X2Z1LmpwZWciLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MjAwLCJoZWlnaHQiOjIwMCwiZml0IjoiY292ZXIifX19', derby: 'FICA-PLC-01' },
  { id: 'FCJE-ICO-02', name: 'Comercial Niupi', career: 'Ingeniería Comercial', faculty: 'Facultad de Ciencias Jurídicas y Empresariales', division: 1, baseOvr: 78, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzU4NjMzX3Jlc19jb21lcmNpYWxfbml1cGkuanBnIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsid2lkdGgiOjIwMCwiaGVpZ2h0IjoyMDAsImZpdCI6ImNvdmVyIn19fQ==', derby: 'FCJE-ICO-01' },
  { id: 'FICA-PLC-01', name: 'Manchester Civil', career: 'Ingeniería Civil (Plan Común)', faculty: 'Facultad de Ingeniería y Ciencias', division: 1, baseOvr: 75, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzE3NDU4X3Jlc19tYW5jaGVzdGVyX2NpdmlsX2Y3X2hvbWJyZXMucG5nIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsid2lkdGgiOjIwMCwiaGVpZ2h0IjoyMDAsImZpdCI6ImNvdmVyIn19fQ==', derby: 'FICA-IND-02' },
  { id: 'MED-KIN-02', name: 'Kinester City', career: 'Kinesiología', faculty: 'Facultad de Medicina', division: 1, baseOvr: 72, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzQyMjU3XzFfa2luZXN0ZXJjaXR5LmpwZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: 'MED-KIN-01' },
  { id: 'MED-MED-01', name: 'Hipergolémicos FC', career: 'Medicina', faculty: 'Facultad de Medicina', division: 1, baseOvr: 82, achievements: 'Campeones Interfacultades x1', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzIwNzMyX3Jlc19oaXBlcmdvbGVtaWNvc19mYy5wbmciLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MjAwLCJoZWlnaHQiOjIwMCwiZml0IjoiY292ZXIifX19', derby: 'MED-MED-02' },
  { id: 'FCJE-DER-01', name: 'Corte Supremo', career: 'Derecho', faculty: 'Facultad de Ciencias Jurídicas y Empresariales', division: 1, baseOvr: 81, achievements: 'Campeones Copa Iustitia x1', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzM3MzQ2X2NvcnRlX3N1cHJlbW9fZjdfaG9tYnJlcy5qcGVnIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsid2lkdGgiOjIwMCwiaGVpZ2h0IjoyMDAsImZpdCI6ImNvdmVyIn19fQ==', derby: 'FCJE-DER-02' },
  { id: 'FECSH-EFI-04', name: 'EFI United', career: 'Pedagogía en Educación Física, Deportes y Recreación', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 1, baseOvr: 80, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzQ1NjE4X3Jlc19lZmlfdW5pdGVkLnBuZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: '' },
  { id: 'FICA-CON-01', name: 'Real Construcción', career: 'Ingeniería en Construcción', faculty: 'Facultad de Ingeniería y Ciencias', division: 1, baseOvr: 80, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzIyMTQ1X3Jlc19yZWFsX2NvbnN0cnVjY2lvbi5qcGVnIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsid2lkdGgiOjIwMCwiaGVpZ2h0IjoyMDAsImZpdCI6ImNvdmVyIn19fQ==', derby: '' },
  { id: 'FICA-ELE-02', name: 'Manchester Watts', career: 'Ingeniería Civil Eléctrica', faculty: 'Facultad de Ingeniería y Ciencias', division: 1, baseOvr: 80, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzgxNjQxX21hbmNoZXN0ZXJfd2F0dHMucG5nIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsid2lkdGgiOjIwMCwiaGVpZ2h0IjoyMDAsImZpdCI6ImNvdmVyIn19fQ==', derby: 'FICA-ELE-01' },
  { id: 'FICA-ELE-01', name: 'Electrics de Marsella', career: 'Ingeniería Civil Eléctrica', faculty: 'Facultad de Ingeniería y Ciencias', division: 1, baseOvr: 79, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzgzMzg2XzFfZWxlY3RyaWNzX2RlX21hcmNlbGxhLmpwZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: 'FICA-ELE-02' },
  { id: 'FECSH-PER-01', name: 'Periodimo FC', career: 'Periodismo', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 1, baseOvr: 78, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzU0OTIxX3Jlc19wZXJpb2Rpc21vLmpwZWciLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MjAwLCJoZWlnaHQiOjIwMCwiZml0IjoiY292ZXIifX19', derby: '' },
  { id: 'FECSH-HIS-01', name: 'CD Historia B', career: 'Pedagogía en Historia, Geografía y Educación Cívica', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 1, baseOvr: 77, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzkzMTg3XzFfaGlzdG9yaWFfYi5qcGciLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MjAwLCJoZWlnaHQiOjIwMCwiZml0IjoiY292ZXIifX19', derby: '' },
  { id: 'MED-NUT-01', name: 'Nutrinaited', career: 'Nutrición y Dietética', faculty: 'Facultad de Medicina', division: 1, baseOvr: 77, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzMxMzE3XzFfbnV0cmluYWl0ZWRfZmMuanBnIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsid2lkdGgiOjIwMCwiaGVpZ2h0IjoyMDAsImZpdCI6ImNvdmVyIn19fQ==', derby: '' },
  { id: 'FICA-AMB-01', name: 'West Hambiental', career: 'Ingeniería Civil Ambiental', faculty: 'Facultad de Ingeniería y Ciencias', division: 1, baseOvr: 76, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzE1OTE1X3Jlc193ZXN0X2hhbWJpZW50YWwuanBlZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: '' },
  { id: 'FICA-IND-01', name: 'Industrial Gunners', career: 'Ingeniería Civil Industrial', faculty: 'Facultad de Ingeniería y Ciencias', division: 1, baseOvr: 81, achievements: 'Campeones Copa FICA x2', escudo: '', derby: 'FICA-IND-02' },

  // 2ª DIVISIÓN (26 EQUIPOS)
  { id: 'FECSH-EFI-02', name: 'Efiorentina', career: 'Pedagogía en Educación Física, Deportes y Recreación', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 2, baseOvr: 73, achievements: 'Campeones Copa FESCH x1', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzU3NDY0XzJfZWZpb3JlbnRpbmFfLnBuZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: 'FECSH-EFI-01' },
  { id: 'FCAM-AGR-03', name: 'Agrolechones', career: 'Agronomía', faculty: 'Facultad de Ciencias Agropecuarias y Medioambiente', division: 2, baseOvr: 74, achievements: 'Subcampeones 2da División x1', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzM0Mzk1XzJfYWdyb2xlY2hvbmVzLnBuZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: 'FCAM-AGR-02' },
  { id: 'FCAM-AGR-02', name: 'Agro John Deere FC', career: 'Agronomía', faculty: 'Facultad de Ciencias Agropecuarias y Medioambiente', division: 2, baseOvr: 71, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzY0OTA1X2pvaG5fZGVyZWUuanBnIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsid2lkdGgiOjIwMCwiaGVpZ2h0IjoyMDAsImZpdCI6ImNvdmVyIn19fQ==', derby: 'FCAM-AGR-03' },
  { id: 'MED-MED-02', name: 'El Top Medufro', career: 'Medicina', faculty: 'Facultad de Medicina', division: 2, baseOvr: 73, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzIwNDAxXzNfbWVkX3Vmcm9fLmpwZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: 'MED-MED-01' },
  { id: 'FCJE-DER-02', name: 'Juristas United', career: 'Derecho', faculty: 'Facultad de Ciencias Jurídicas y Empresariales', division: 2, baseOvr: 72, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzM0MzQwXzJfanVyaXN0YXNfdW5pdGVkLmpwZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: 'FCJE-DER-01' },
  { id: 'FECSH-EFI-05', name: 'Lacustre EFI', career: 'Pedagogía en Educación Física, Deportes y Recreación', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 2, baseOvr: 71, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzEzMDQwX2Nkc19sYWN1c3RyZV92aWxsYXJyaWNhLmpwZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: '' },
  { id: 'MED-TER-02', name: 'FutboliTOs', career: 'Terapia Ocupacional', faculty: 'Facultad de Medicina', division: 2, baseOvr: 69, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzk5MzE2X3RvXy5qcGVnIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsid2lkdGgiOjIwMCwiaGVpZ2h0IjoyMDAsImZpdCI6ImNvdmVyIn19fQ==', derby: '' },
  { id: 'FECSH-TSO-02', name: 'Traso FC', career: 'Trabajo Social', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 2, baseOvr: 68, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzU2MTg3XzJfdHJhc29fZmMuanBlZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: '' },
  { id: 'FCJE-ICO-04', name: 'Olimpiacomercial', career: 'Ingeniería Comercial', faculty: 'Facultad de Ciencias Jurídicas y Empresariales', division: 2, baseOvr: 64, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzM4NTczX29saW1waWFrb3NfbWVyY2lhbF9hbGV4aXNfbWF0aWFzX2FyYW5lZGFfZ3V6bWFuLnBuZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: '' },
  { id: 'FICA-INF-02', name: 'Deportivo Algoritmo', career: 'Ingeniería Civil Informática', faculty: 'Facultad de Ingeniería y Ciencias', division: 2, baseOvr: 73, achievements: 'Campeones 3ra División x1', escudo: '', derby: '' },
  { id: 'FCAM-VET-02', name: 'Real Vetis', career: 'Medicina Veterinaria', faculty: 'Facultad de Ciencias Agropecuarias y Medioambiente', division: 2, baseOvr: 72, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FECSH-PER-02', name: 'Crónica Central', career: 'Periodismo', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 2, baseOvr: 71, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-MEC-02', name: 'Dinamo Mecánica', career: 'Ingeniería Civil Mecánica', faculty: 'Facultad de Ingeniería y Ciencias', division: 2, baseOvr: 71, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'MED-ENF-02', name: 'Cuidados Intensivos', career: 'Enfermería', faculty: 'Facultad de Medicina', division: 2, baseOvr: 71, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'ODO-ODO-02', name: 'Molar United', career: 'Odontología', faculty: 'Facultad de Odontología', division: 2, baseOvr: 71, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FCAM-BIO-02', name: 'Mutación United', career: 'Biotecnología', faculty: 'Facultad de Ciencias Agropecuarias y Medioambiente', division: 2, baseOvr: 70, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FCJE-AUD-02', name: 'Débito y Crédito', career: 'Contador Público y Auditor', faculty: 'Facultad de Ciencias Jurídicas y Empresariales', division: 2, baseOvr: 70, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FECSH-HIS-02', name: 'Cronos F.C.', career: 'Pedagogía en Historia, Geografía y Educación Cívica', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 2, baseOvr: 70, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FECSH-PSI-02', name: 'Deportivo Freud', career: 'Psicología', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 2, baseOvr: 70, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-ELC-02', name: 'Resistencia F.C.', career: 'Ingeniería Civil Electrónica', faculty: 'Facultad de Ingeniería y Ciencias', division: 2, baseOvr: 70, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-TEL-02', name: 'Redes United', career: 'Ingeniería Civil Telemática', faculty: 'Facultad de Ingeniería y Ciencias', division: 2, baseOvr: 70, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'MED-OBS-02', name: 'Neonatal F.C.', career: 'Obstetricia y Puericultura', faculty: 'Facultad de Medicina', division: 2, baseOvr: 70, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'MED-TEC-02', name: 'Rayos X United', career: 'Tecnología Médica', faculty: 'Facultad de Medicina', division: 2, baseOvr: 70, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FCAM-IRN-02', name: 'Hidro United', career: 'Ingeniería en Recursos Naturales', faculty: 'Facultad de Ciencias Agropecuarias y Medioambiente', division: 2, baseOvr: 69, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FECSH-MAT-02', name: 'Matemanchester', career: 'Pedagogía en Matemática', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 2, baseOvr: 69, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FECSH-SOC-02', name: 'Estructura F.C.', career: 'Sociología', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 2, baseOvr: 69, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },

  // 3ª DIVISIÓN · CONFERENCIA A (21 EQUIPOS)
  { id: 'FECSH-PSI-03', name: 'Psikosiaos', career: 'Psicología', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 3, conf: 'A', baseOvr: 69, achievements: 'Sin títulos oficiales', escudo: '', derby: 'FCAM-IRN-03' },
  { id: 'FCAM-IRN-03', name: 'HUED-HUID', career: 'Ingeniería en Recursos Naturales', faculty: 'Facultad de Ciencias Agropecuarias y Medioambiente', division: 3, conf: 'A', baseOvr: 60, achievements: 'Sin títulos oficiales', escudo: '', derby: 'FECSH-PSI-03' },
  { id: 'FECSH-EFI-03', name: 'Mitocondrias FC', career: 'Pedagogía en Educación Física, Deportes y Recreación', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 3, conf: 'A', baseOvr: 65, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-CON-02', name: 'Galacticos', career: 'Ingeniería en Construcción', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'A', baseOvr: 65, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzI5OV9nYWxhY3RpY29zX2ZjLmpwZWciLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MjAwLCJoZWlnaHQiOjIwMCwiZml0IjoiY292ZXIifX19', derby: '' },
  { id: 'FCJE-ICO-03', name: 'Comerciales Juniors', career: 'Ingeniería Comercial', faculty: 'Facultad de Ciencias Jurídicas y Empresariales', division: 3, conf: 'A', baseOvr: 64, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzIwNTMyX2NvbWVyY2lhbGVzX2p1bmlvcnNfZjdfaG9tYnJlcy5wbmciLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MjAwLCJoZWlnaHQiOjIwMCwiZml0IjoiY292ZXIifX19', derby: '' },
  { id: 'FICA-PLC-02', name: 'Ingenieria del Gol', career: 'Ingeniería Civil (Plan Común)', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'A', baseOvr: 64, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzgwMDk3X2luZ2VuaWVyX2FfZGVsX2dvbF9mN19ob21icmVzLmpwZWciLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MjAwLCJoZWlnaHQiOjIwMCwiZml0IjoiY292ZXIifX19', derby: '' },
  { id: 'FCJE-ICO-05', name: 'Discomercial', career: 'Ingeniería Comercial', faculty: 'Facultad de Ciencias Jurídicas y Empresariales', division: 3, conf: 'A', baseOvr: 64, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FCJE-DER-03', name: 'Deportivo Ilicito', career: 'Derecho', faculty: 'Facultad de Ciencias Jurídicas y Empresariales', division: 3, conf: 'A', baseOvr: 63, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'ODO-ODO-03', name: 'Paris Saint Dental', career: 'Odontología', faculty: 'Facultad de Odontología', division: 3, conf: 'A', baseOvr: 62, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FCJE-AUD-03', name: 'Contarchester United', career: 'Contador Público y Auditor', faculty: 'Facultad de Ciencias Jurídicas y Empresariales', division: 3, conf: 'A', baseOvr: 61, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzM4NTQ5X2NvbnRhcmNoZXN0ZXJfdW5pdGVkLnBuZyIsImVkaXRzIjp7InJvdGF0ZSI6bnVsbCwicmVzaXplIjp7IndpZHRoIjoyMDAsImhlaWdodCI6MjAwLCJmaXQiOiJjb3ZlciJ9fX0=', derby: '' },
  { id: 'FECSH-DIF-01', name: 'Diferencial United', career: 'Pedagogía en Educación Diferencial', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 3, conf: 'A', baseOvr: 60, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzM5ODkxX2RpZmVyZW5jaWFsX3VuaXRlZF8ucG5nIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsid2lkdGgiOjIwMCwiaGVpZ2h0IjoyMDAsImZpdCI6ImNvdmVyIn19fQ==', derby: '' },
  { id: 'FECSH-HIS-03', name: 'Rupu HyG FC', career: 'Pedagogía en Historia, Geografía y Educación Cívica', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 3, conf: 'A', baseOvr: 60, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FECSH-CIE-03', name: 'CA Ciencias', career: 'Pedagogía en Ciencias mención Biología, Química o Física', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 3, conf: 'A', baseOvr: 58, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzY2MjU5XzJfY2FfY2llbmNpYXNfLmpwZWciLCJlZGl0cyI6eyJyb3RhdGUiOm51bGwsInJlc2l6ZSI6eyJ3aWR0aCI6MjAwLCJoZWlnaHQiOjIwMCwiZml0IjoiY292ZXIifX19', derby: '' },
  { id: 'FECSH-SOC-03', name: 'Sociología FC', career: 'Sociología', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 3, conf: 'A', baseOvr: 58, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzIwNjlfc29jaW9sb2dfYV9mY19sb2dvX2ZlbGlwZV9pZ25hY2lvX295YXJ6dW5faGFyby5qcGVnIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsid2lkdGgiOjIwMCwiaGVpZ2h0IjoyMDAsImZpdCI6ImNvdmVyIn19fQ==', derby: '' },
  { id: 'FICA-PLC-03', name: 'Plan Común FC', career: 'Ingeniería Civil (Plan Común)', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'A', baseOvr: 56, achievements: 'Sin títulos oficiales', escudo: 'https://images.ligup2.com/eyJidWNrZXQiOiJsaWd1cC12MiIsImtleSI6ImRlcG9ydGVzdWZyb1wvY29sbGVjdGl2ZXNcLzU5NDM5X3BsYW5fY29tX25fZmMucG5nIiwiZWRpdHMiOnsicm90YXRlIjpudWxsLCJyZXNpemUiOnsid2lkdGgiOjIwMCwiaGVpZ2h0IjoyMDAsImZpdCI6ImNvdmVyIn19fQ==', derby: '' },
  { id: 'MED-MED-03', name: 'Galenos F.C.', career: 'Medicina', faculty: 'Facultad de Medicina', division: 3, conf: 'A', baseOvr: 65, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-INF-03', name: 'Átletico Binario', career: 'Ingeniería Civil Informática', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'A', baseOvr: 64, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'MED-KIN-03', name: 'Rehabilitación F.C.', career: 'Kinesiología', faculty: 'Facultad de Medicina', division: 3, conf: 'A', baseOvr: 64, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-CON-03', name: 'Engineers en Constru', career: 'Ingeniería en Construcción', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'A', baseOvr: 63, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-IND-03', name: 'Cadena de Valor Sporting', career: 'Ingeniería Civil Industrial', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'A', baseOvr: 63, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'MED-ENF-03', name: 'Vocación Sporting', career: 'Enfermería', faculty: 'Facultad de Medicina', division: 3, conf: 'A', baseOvr: 63, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },

  // 3ª DIVISIÓN · CONFERENCIA B (21 EQUIPOS)
  { id: 'FCAM-AGR-01', name: 'Semillero Austral F.C.', career: 'Agronomía', faculty: 'Facultad de Ciencias Agropecuarias y Medioambiente', division: 3, conf: 'B', baseOvr: 62, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FECSH-PER-03', name: 'Deportivo Redacción', career: 'Periodismo', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 3, conf: 'B', baseOvr: 62, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-MEC-03', name: 'Mechanical United', career: 'Ingeniería Civil Mecánica', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'B', baseOvr: 62, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'MED-TEC-03', name: 'Microscopio Sporting', career: 'Tecnología Médica', faculty: 'Facultad de Medicina', division: 3, conf: 'B', baseOvr: 62, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FCAM-BIO-03', name: 'Cultivo Sporting', career: 'Biotecnología', faculty: 'Facultad de Ciencias Agropecuarias y Medioambiente', division: 3, conf: 'B', baseOvr: 61, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-ELC-03', name: 'Microchip United', career: 'Ingeniería Civil Electrónica', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'B', baseOvr: 61, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-MAT-03', name: 'Fractal United', career: 'Ingeniería Civil Matemática', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'B', baseOvr: 61, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'MED-NUT-03', name: 'Proteico Sporting', career: 'Nutrición y Dietética', faculty: 'Facultad de Medicina', division: 3, conf: 'B', baseOvr: 61, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FCAM-VET-01', name: 'VET United FC', career: 'Medicina Veterinaria', faculty: 'Facultad de Ciencias Agropecuarias y Medioambiente', division: 3, conf: 'B', baseOvr: 60, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FECSH-MAT-03', name: 'Derivada Sporting', career: 'Pedagogía en Matemática', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 3, conf: 'B', baseOvr: 60, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-ELE-03', name: 'Corriente Sporting', career: 'Ingeniería Civil Eléctrica', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'B', baseOvr: 60, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-QFA-03', name: 'Píldora Sporting', career: 'Química y Farmacia', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'B', baseOvr: 60, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'MED-OBS-03', name: 'Alumbramiento Sporting', career: 'Obstetricia y Puericultura', faculty: 'Facultad de Medicina', division: 3, conf: 'B', baseOvr: 60, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FECSH-ING-03', name: 'London City F.C.', career: 'Pedagogía en Inglés', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 3, conf: 'B', baseOvr: 59, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FECSH-TSO-03', name: 'Atlético Bienestar', career: 'Trabajo Social', faculty: 'Facultad de Educación, Ciencias Sociales y Humanidades', division: 3, conf: 'B', baseOvr: 59, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-BQM-03', name: 'Molécula Sporting', career: 'Bioquímica', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'B', baseOvr: 59, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-QUI-03', name: 'Catalizador F.C.', career: 'Ingeniería Civil Química', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'B', baseOvr: 59, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-TEL-03', name: 'Enlace Sporting', career: 'Ingeniería Civil Telemática', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'B', baseOvr: 59, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'MED-FON-03', name: 'Acústica Sporting', career: 'Fonoaudiología', faculty: 'Facultad de Medicina', division: 3, conf: 'B', baseOvr: 59, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-AMB-03', name: 'Reciclaje Sporting', career: 'Ingeniería Civil Ambiental', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'B', baseOvr: 58, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
  { id: 'FICA-BIO-03', name: 'Celular Sporting', career: 'Ingeniería Civil en Biotecnología', faculty: 'Facultad de Ingeniería y Ciencias', division: 3, conf: 'B', baseOvr: 58, achievements: 'Sin títulos oficiales', escudo: '', derby: '' },
];

const FIRST_NAMES = [
  'Benjamín', 'Matías', 'Vicente', 'Joaquín', 'Sebastián', 'Martín', 'Diego', 'Lucas',
  'Tomás', 'Cristóbal', 'Felipe', 'Nicolás', 'Ignacio', 'Gabriel', 'Alonso', 'Maximiliano',
  'Bastián', 'Camilo', 'Renato', 'Luciano', 'Agustín', 'Esteban', 'Franco', 'Rodrigo',
  'Emilio', 'Ángel', 'Patricio', 'Mauricio', 'Diego', 'Pablo', 'Andrés', 'Daniel',
];

const LAST_NAMES = [
  'Rojas', 'Soto', 'Muñoz', 'Morales', 'Castro', 'Contreras', 'Valenzuela', 'Sepúlveda',
  'Araya', 'Fuentes', 'Carrasco', 'Vega', 'Alarcón', 'Navarro', 'Flores', 'Riquelme',
  'Paredes', 'Tapia', 'Garrido', 'Mendoza', 'Herrera', 'Saavedra', 'Cáceres', 'Salinas',
  'Pinilla', 'Vidal', 'Pacheco', 'Molina', 'Bravo', 'Ortiz', 'Pérez', 'Campos',
];

const FACULTY_COLORS = {
  FECSH: '#8b5cf6',
  FICA: '#3b82f6',
  MED: '#10b981',
  FCAM: '#22c55e',
  FCJE: '#f59e0b',
  ODO: '#ec4899',
  OTRAS: '#717fff',
};

export function inferFacultyKey(rawFaculty, career = '') {
  const s = `${rawFaculty || ''} ${career || ''}`.toLowerCase();
  if (s.includes('fecsh') || s.includes('educaci') || s.includes('humanidades') || s.includes('psicolog') || s.includes('periodismo') || s.includes('sociolog') || s.includes('trabajo social') || s.includes('pedagog')) return 'FECSH';
  if (s.includes('fica') || s.includes('ingenier') || s.includes('construcci') || s.includes('bioquím') || s.includes('farmacia')) return 'FICA';
  if (s.includes('medicina') && !s.includes('veterin')) return 'MED';
  if (s.includes('enfermer') || s.includes('kinesiolog') || s.includes('nutrici') || s.includes('obstetric') || s.includes('tecnología médica') || s.includes('fonoaudi') || s.includes('terapia')) return 'MED';
  if (s.includes('fcam') || s.includes('agro') || s.includes('veterin') || s.includes('recursos naturales') || (s.includes('biotecnolog') && !s.includes('civil'))) return 'FCAM';
  if (s.includes('fcje') || s.includes('derecho') || s.includes('comercial') || s.includes('contador')) return 'FCJE';
  if (s.includes('odo') || s.includes('odontolog')) return 'ODO';
  return 'OTRAS';
}

export function getTeamColorByFaculty(faculty, career = '') {
  const k = inferFacultyKey(faculty, career);
  return FACULTY_COLORS[k] || '#717fff';
}

export function normalizeTextKey(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function parseCsvText(csvText) {
  const text = String(csvText || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\r' && next === '\n') {
      row.push(cell.trim());
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
      i += 1;
    } else if (ch === '\n' || ch === '\r') {
      row.push(cell.trim());
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c !== '')) rows.push(row);
  }
  return rows;
}

export function computeAgeFromBirthDate(rawDate, referenceYear = 2026) {
  const s = String(rawDate || '').trim();
  if (!s) return 21;
  let birthYear = null;
  const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (isoMatch) {
    birthYear = Number(isoMatch[1]);
  } else if (dmyMatch) {
    birthYear = Number(dmyMatch[3]);
  } else {
    const numYear = s.match(/(19\d{2}|20\d{2})/);
    if (numYear) birthYear = Number(numYear[1]);
  }
  if (!birthYear || Number.isNaN(birthYear)) return 21;
  return Math.max(17, Math.min(34, referenceYear - birthYear));
}

export function validateTeamCareerMatch(playerCareer, clubCareer, explicitValue = '') {
  const exp = normalizeTextKey(explicitValue);
  if (exp === 'pertenece' || exp === 'si' || exp === 'yes' || exp === 'true' || exp === '1' || exp === 'valido' || exp === 'misma carrera') {
    return true;
  }
  if (exp === 'no pertenece' || exp === 'carrera no oficial' || exp === 'no oficial' || exp === 'no' || exp === 'false' || exp === '0' || exp === 'externo' || exp === 'otra carrera') {
    return false;
  }
  const pc = normalizeTextKey(playerCareer);
  const cc = normalizeTextKey(clubCareer);
  if (!pc || !cc) return true;
  return pc === cc;
}

export function calculatePlayerValueEur(player) {
  const ovr = Math.max(50, Math.min(95, Number(player?.ovr) || 64));
  const age = Math.max(17, Math.min(34, Number(player?.age) || 21));
  const ageFactor = age <= 20 ? 1.22 : age <= 23 ? 1.1 : age <= 26 ? 1.0 : 0.84;
  const st = player?.stats || {};
  const perfBonus = (st.goals || 0) * 2800 + (st.assists || 0) * 2000 + (st.cleanSheets || 0) * 3200;
  const base = Math.pow(Math.max(1, ovr - 48), 1.95) * 245;
  return Math.max(8000, Math.round(((base + perfBonus) * ageFactor) / 1000) * 1000);
}

export function calculateInitialClubBudget(team) {
  const div = Number(team?.division) || 3;
  let base = div === 1 ? 460000 : div === 2 ? 250000 : 120000;

  const careerKey = normalizeTextKey(team?.career);
  if (careerKey.includes('ingenier') || careerKey.includes('medicina') || careerKey.includes('derecho') || careerKey.includes('comercial')) {
    base += div === 1 ? 85000 : div === 2 ? 48000 : 25000;
  } else if (careerKey.includes('educacion fisica') || careerKey.includes('kinesiolog') || careerKey.includes('odontolog')) {
    base += div === 1 ? 65000 : div === 2 ? 38000 : 20000;
  } else {
    base += div === 1 ? 35000 : div === 2 ? 22000 : 12000;
  }

  const ovrBonus = Math.max(0, (Number(team?.baseOvr) || 62) - (div === 1 ? 74 : div === 2 ? 67 : 58)) * 7500;

  const achText = normalizeTextKey(team?.achievements);
  let achBonus = 0;
  if (achText && !achText.includes('sin titulos')) {
    const multMatch = achText.match(/x(\d+)/);
    const mult = multMatch ? Math.max(1, Math.min(5, Number(multMatch[1]))) : 1;
    if (achText.includes('campeon') || achText.includes('1era') || achText.includes('interfacultades')) {
      achBonus += 55000 * mult;
    } else {
      achBonus += 30000 * mult;
    }
  }

  return Math.round((base + ovrBonus + achBonus) / 5000) * 5000;
}

function makePlayerId(seedIdx) {
  return `jug_${seedIdx}_${Math.random().toString(36).slice(2, 6)}`;
}

function randomBirthDateForAge(age, rng = Math.random) {
  const year = 2026 - age;
  const month = String(Math.floor(rng() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(rng() * 28) + 1).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

export function createSquadPlayer({
  id,
  teamId,
  firstName,
  lastName,
  birthDate,
  age,
  studiedCareer,
  clubCareer,
  explicitCareerValid,
  position,
  secondaryPositions,
  trainingTargetPos = null,
  seasonsAtClub,
  ovr,
  jerseyNumber,
  contractSemesters,
  morale,
  transferListed = false,
  rng = Math.random,
}) {
  const resolvedAge = Number.isFinite(Number(age))
    ? Math.max(17, Math.min(34, Number(age)))
    : birthDate
      ? computeAgeFromBirthDate(birthDate, 2026)
      : Math.floor(18 + rng() * 7);
  const resolvedBirth = birthDate || randomBirthDateForAge(resolvedAge, rng);
  const resolvedOvr = Math.max(52, Math.min(90, Math.round(Number(ovr) || (58 + rng() * 18))));
  const fName = String(firstName || FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)]).trim();
  const lName = String(lastName || LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)]).trim();
  const resolvedCareer = String(studiedCareer || clubCareer || CARRERAS_UFRO[0]).trim();
  const careerMatchValid = teamId === 'FREE_AGENT'
    ? false
    : validateTeamCareerMatch(resolvedCareer, clubCareer, explicitCareerValid);
  const resolvedTenure = teamId === 'FREE_AGENT'
    ? 0
    : Number.isFinite(Number(seasonsAtClub))
      ? Math.max(1, Number(seasonsAtClub))
      : Math.max(1, Math.min(5, Math.floor((resolvedAge - 17) / 2) + 1));

  const player = {
    id: id || makePlayerId(Math.floor(rng() * 100000)),
    teamId: teamId || 'FREE_AGENT',
    firstName: fName,
    lastName: lName,
    name: `${fName} ${lName}`,
    birthDate: resolvedBirth,
    age: resolvedAge,
    studiedCareer: resolvedCareer,
    careerMatchValid,
    position: ['ARQ', 'DEF', 'MED', 'DEL'].includes(position) ? position : 'MED',
    secondaryPositions: secondaryPositions && typeof secondaryPositions === 'object' ? { ...secondaryPositions } : {},
    trainingTargetPos: ['ARQ', 'DEF', 'MED', 'DEL'].includes(trainingTargetPos) ? trainingTargetPos : null,
    seasonsAtClub: resolvedTenure,
    pendingTransferToTeamId: null,
    ovr: resolvedOvr,
    jerseyNumber: Number(jerseyNumber) || 1,
    contractSemesters: Number.isFinite(Number(contractSemesters)) ? Math.max(1, Number(contractSemesters)) : (Math.floor(rng() * 5) + 2),
    morale: Number.isFinite(Number(morale)) ? Math.max(15, Math.min(100, Number(morale))) : (Math.floor(rng() * 24) + 68),
    transferListed: Boolean(transferListed),
    stats: {
      matches: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      mvpCount: 0,
      ratingSum: 0,
    },
  };
  player.marketValueEur = calculatePlayerValueEur(player);
  return player;
}

export function generateSeedSquadForTeam(team, rng = Math.random, idPrefix = '') {
  const layout = ['ARQ', 'ARQ', 'DEF', 'DEF', 'DEF', 'DEF', 'MED', 'MED', 'MED', 'MED', 'MED', 'DEL', 'DEL', 'DEL'];
  const jerseys = [1, 12, 2, 3, 4, 5, 6, 8, 10, 14, 15, 7, 9, 11];
  const base = Number(team.baseOvr) || (team.division === 1 ? 76 : team.division === 2 ? 69 : 61);
  const usedNames = new Set();

  return layout.map((pos, idx) => {
    let fName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
    let lName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
    let guard = 0;
    while (usedNames.has(`${fName} ${lName}`) && guard < 15) {
      fName = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
      lName = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
      guard += 1;
    }
    usedNames.add(`${fName} ${lName}`);

    const isStarterTier = idx === 0 || (idx >= 2 && idx <= 4) || (idx >= 6 && idx <= 8) || (idx >= 11 && idx <= 12);
    const delta = isStarterTier ? Math.round(rng() * 5 - 1) : Math.round(rng() * 6 - 7);
    const ovr = Math.max(54, Math.min(89, base + delta));
    const matchesClubCareer = rng() < 0.78;
    const studiedCareer = matchesClubCareer
      ? team.career
      : CARRERAS_UFRO[Math.floor(rng() * CARRERAS_UFRO.length)];

    return createSquadPlayer({
      id: `${idPrefix || team.id}_P${String(idx + 1).padStart(2, '0')}`,
      teamId: team.id,
      firstName: fName,
      lastName: lName,
      studiedCareer,
      clubCareer: team.career,
      position: pos,
      ovr,
      jerseyNumber: jerseys[idx],
      contractSemesters: Math.floor(rng() * 5) + 2,
      morale: Math.floor(rng() * 22) + 70,
      rng,
    });
  });
}

export function generateFreeAgentsPool(count = 45, rng = Math.random) {
  const positions = ['ARQ', 'DEF', 'MED', 'DEL'];
  const list = [];
  for (let i = 0; i < count; i += 1) {
    const pos = positions[i % positions.length];
    const ovr = Math.max(56, Math.min(79, Math.round(58 + rng() * 20)));
    list.push(createSquadPlayer({
      id: `FA_${String(i + 1).padStart(3, '0')}`,
      teamId: 'FREE_AGENT',
      studiedCareer: CARRERAS_UFRO[Math.floor(rng() * CARRERAS_UFRO.length)],
      clubCareer: '',
      position: pos,
      ovr,
      jerseyNumber: (i % 30) + 1,
      contractSemesters: 0,
      morale: 75,
      rng,
    }));
  }
  return list;
}

function buildTeamModel(raw, index, rng) {
  const division = Number(raw.division) === 1 ? 1 : Number(raw.division) === 2 ? 2 : 3;
  const conf = division === 3 ? (raw.conf === 'B' ? 'B' : 'A') : null;
  const code = String(raw.id || `UFRO-${index + 1}`).trim();
  const team = {
    id: code,
    code,
    name: String(raw.name || `Equipo ${index + 1}`).trim(),
    career: String(raw.career || CARRERAS_UFRO[index % CARRERAS_UFRO.length]).trim(),
    faculty: String(raw.faculty || 'Universidad de La Frontera').trim(),
    facultyKey: inferFacultyKey(raw.faculty, raw.career),
    color: raw.color || getTeamColorByFaculty(raw.faculty, raw.career),
    division,
    conf,
    baseOvr: Number(raw.baseOvr) || (division === 1 ? 76 : division === 2 ? 69 : 61),
    achievements: String(raw.achievements || 'Sin títulos oficiales').trim(),
    escudo: String(raw.escudo || '').trim(),
    derby: String(raw.derby || '').trim(),
    formation: '1-2-3-1',
    isUserClub: false,
    players: [],
    starterIds: [],
    benchIds: [],
  };
  team.budgetEur = calculateInitialClubBudget(team);
  return team;
}

function assignLineupForTeam(team) {
  const players = [...(team.players || [])];
  const byPos = {
    ARQ: players.filter((p) => p.position === 'ARQ').sort((a, b) => b.ovr - a.ovr),
    DEF: players.filter((p) => p.position === 'DEF').sort((a, b) => b.ovr - a.ovr),
    MED: players.filter((p) => p.position === 'MED').sort((a, b) => b.ovr - a.ovr),
    DEL: players.filter((p) => p.position === 'DEL').sort((a, b) => b.ovr - a.ovr),
  };

  const picked = [];
  const take = (arr, count) => {
    for (let i = 0; i < count && arr.length > 0; i += 1) {
      picked.push(arr.shift());
    }
  };
  take(byPos.ARQ, 1);
  take(byPos.DEF, 2);
  take(byPos.MED, 3);
  take(byPos.DEL, 1);

  const remaining = [...byPos.DEF, ...byPos.MED, ...byPos.DEL, ...byPos.ARQ].sort((a, b) => b.ovr - a.ovr);
  while (picked.length < 7 && remaining.length > 0) {
    picked.push(remaining.shift());
  }

  team.starterIds = picked.map((p) => p.id);
  const starterSet = new Set(team.starterIds);
  team.benchIds = players.filter((p) => !starterSet.has(p.id)).map((p) => p.id);
}

export function buildSeedDatabase(rng = Math.random, meta = {}) {
  const teams = SEED_UFRO_TEAMS.map((raw, idx) => {
    const team = buildTeamModel(raw, idx, rng);
    team.players = generateSeedSquadForTeam(team, rng);
    assignLineupForTeam(team);
    return team;
  });

  const freeAgents = generateFreeAgentsPool(45, rng);
  return {
    source: meta.source || 'fallback_seed',
    sheetUrl: meta.sheetUrl || DEFAULT_NOTFC_SHEET_URL,
    sheetError: meta.sheetError || '',
    carrerasUfro: [...CARRERAS_UFRO],
    teams,
    freeAgents,
  };
}

function mapCsvToObjects(csvText) {
  const rows = parseCsvText(csvText);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => normalizeTextKey(h));
  return rows.slice(1).map((cols) => {
    const obj = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    return obj;
  });
}

function pickField(row, candidates) {
  for (const cand of candidates) {
    const k = normalizeTextKey(cand);
    if (row[k] !== undefined && String(row[k]).trim() !== '') {
      return String(row[k]).trim();
    }
  }
  return '';
}

function inferDivisionFromTabOrRow(tabName, row) {
  const rawDiv = pickField(row, ['division', 'div', 'categoria']);
  const combined = `${rawDiv} ${tabName || ''}`.toLowerCase();
  if (combined.includes('1') || combined.includes('primera')) return 1;
  if (combined.includes('2') || combined.includes('segunda')) return 2;
  if (combined.includes('3') || combined.includes('tercera')) return 3;
  return 3;
}

function inferConferenceFromTabOrRow(tabName, row, div3Index) {
  const rawConf = pickField(row, ['conferencia', 'conf', 'grupo', 'zona']);
  const combined = `${rawConf} ${tabName || ''}`.toUpperCase();
  if (combined.includes('CONFERENCIA B') || combined.includes('CONF B') || rawConf.trim().toUpperCase() === 'B') return 'B';
  if (combined.includes('CONFERENCIA A') || combined.includes('CONF A') || rawConf.trim().toUpperCase() === 'A') return 'A';
  return div3Index % 2 === 0 ? 'A' : 'B';
}

export function buildDatabaseFromSheetsPayload(payload, rng = Math.random) {
  if (!payload || !payload.ok || !Array.isArray(payload.equiposTabs) || payload.equiposTabs.length === 0) {
    return buildSeedDatabase(rng, {
      source: 'fallback_seed',
      sheetUrl: payload?.sheetUrl || DEFAULT_NOTFC_SHEET_URL,
      sheetError: payload?.error || 'Usando base UFRO integrada.',
    });
  }

  const seedById = new Map(SEED_UFRO_TEAMS.map((s) => [s.id.toUpperCase(), s]));
  const seedByName = new Map(SEED_UFRO_TEAMS.map((s) => [normalizeTextKey(s.name), s]));

  const parsedTeams = [];
  const seenTeamIds = new Set();
  let div3Counter = 0;

  for (const tab of payload.equiposTabs) {
    const rows = mapCsvToObjects(tab.csv);
    for (const row of rows) {
      const id = pickField(row, ['id', 'id equipo', 'codigo unico', 'codigo']);
      const name = pickField(row, ['nombre', 'nombre equipo', 'equipo', 'club']);
      if (!id && !name) continue;
      const finalId = id || `EQ_${parsedTeams.length + 1}`;
      if (seenTeamIds.has(finalId)) continue;
      seenTeamIds.add(finalId);

      const seedMatch = seedById.get(finalId.toUpperCase()) || seedByName.get(normalizeTextKey(name));
      const division = inferDivisionFromTabOrRow(tab.name, row);
      const conf = division === 3 ? inferConferenceFromTabOrRow(tab.name, row, div3Counter++) : null;
      const career = pickField(row, ['carrera', 'career']) || seedMatch?.career || CARRERAS_UFRO[0];
      const faculty = pickField(row, ['facultad', 'faculty']) || seedMatch?.faculty || 'Universidad de La Frontera';
      const achievements = pickField(row, ['logros anteriores', 'logros', 'palmares', 'titulos']) || 'Sin títulos oficiales';
      const rawEscudo = pickField(row, ['escudo', 'logo', 'imagen']);
      const escudo = rawEscudo.startsWith('https://')
        ? rawEscudo
        : (seedMatch?.escudo && seedMatch.escudo.startsWith('https://') ? seedMatch.escudo : '');
      const derby = pickField(row, ['derby', 'clasico', 'rival']);
      const rawOvr = Number(pickField(row, ['ovr', 'media', 'media base']));
      const fallbackOvr = seedMatch?.baseOvr || (division === 1 ? 75 + (parsedTeams.length % 6) : division === 2 ? 67 + (parsedTeams.length % 6) : 58 + (parsedTeams.length % 6));

      const team = buildTeamModel({
        id: finalId,
        name: name || finalId,
        career,
        faculty,
        division,
        conf,
        baseOvr: Number.isFinite(rawOvr) && rawOvr > 0 ? rawOvr : fallbackOvr,
        achievements,
        escudo,
        derby,
      }, parsedTeams.length, rng);
      parsedTeams.push(team);
    }
  }

  if (parsedTeams.length < 10) {
    return buildSeedDatabase(rng, {
      source: 'fallback_seed',
      sheetUrl: payload.sheetUrl,
      sheetError: 'La hoja F7-EQUIPOS contenía pocos registros; se activó la base UFRO completa.',
    });
  }

  const teamsById = new Map(parsedTeams.map((t) => [t.id.toUpperCase(), t]));
  const teamsByName = new Map(parsedTeams.map((t) => [normalizeTextKey(t.name), t]));
  for (const t of parsedTeams) {
    if (t.derby && !teamsById.has(t.derby.toUpperCase())) {
      const rivalTeam = teamsByName.get(normalizeTextKey(t.derby));
      if (rivalTeam) t.derby = rivalTeam.id;
    }
  }

  const freeAgents = [];
  const posOrder = ['ARQ', 'DEF', 'MED', 'DEL'];

  for (const tab of payload.jugadoresTabs || []) {
    const rows = mapCsvToObjects(tab.csv);
    for (let idx = 0; idx < rows.length; idx += 1) {
      const row = rows[idx];
      const pId = pickField(row, ['id jugador', 'id', 'jugador id']) || `JUG_${tab.name}_${idx + 1}`;
      const teamIdRaw = pickField(row, ['id equipo', 'equipo id', 'team id', 'equipo']) || 'FREE_AGENT';
      const firstName = pickField(row, ['nombre jugador', 'nombre', 'first name']) || 'Jugador';
      const lastName = pickField(row, ['apellido jugador', 'apellido', 'apellidos', 'last name']) || 'UFRO';
      const birthDate = pickField(row, ['fecha de nacimiento', 'fecha nacimiento', 'nacimiento']);
      const studiedCareer = pickField(row, ['carrera jugador', 'carrera', 'carrera cursada']) || CARRERAS_UFRO[0];
      const rawOvrStr = pickField(row, ['ovr', 'media']);
      const rawOvrNum = Number(rawOvrStr);
      const team = teamsById.get(teamIdRaw.toUpperCase());

      // Si el OVR viene vacío en el Google Sheets, se aleatoriza según categoría del club
      const randomizedOvr = team
        ? (team.division === 1 ? 68 + Math.floor(rng() * 14) : team.division === 2 ? 61 + Math.floor(rng() * 13) : 54 + Math.floor(rng() * 12))
        : (58 + Math.floor(rng() * 18));
      const ovr = rawOvrStr !== '' && Number.isFinite(rawOvrNum) && rawOvrNum > 0
        ? Math.max(50, Math.min(92, Math.round(rawOvrNum)))
        : randomizedOvr;

      const explicitValid = pickField(row, ['validacion equipo carrera', 'validacion', 'misma carrera']);
      const rawPos = pickField(row, ['posicion', 'pos']).toUpperCase();
      const pos = ['ARQ', 'DEF', 'MED', 'DEL'].includes(rawPos)
        ? rawPos
        : posOrder[(team ? team.players.length : idx) % posOrder.length];

      const player = createSquadPlayer({
        id: pId,
        teamId: team ? team.id : 'FREE_AGENT',
        firstName,
        lastName,
        birthDate,
        studiedCareer,
        clubCareer: team ? team.career : '',
        explicitCareerValid: explicitValid,
        position: pos,
        ovr,
        jerseyNumber: team ? (team.players.length + 1) : ((idx % 30) + 1),
        rng,
      });

      if (team) {
        team.players.push(player);
      } else {
        freeAgents.push(player);
      }
    }
  }

  // Asegurar mínimo 11 jugadores por equipo si algún club en el Sheet trae menos
  for (const team of parsedTeams) {
    if (team.players.length < 11) {
      const generated = generateSeedSquadForTeam(team, rng, `${team.id}_AUTO`);
      const need = 14 - team.players.length;
      const usedJerseys = new Set(team.players.map((p) => p.jerseyNumber));
      for (let i = 0; i < need && i < generated.length; i += 1) {
        const g = generated[i];
        while (usedJerseys.has(g.jerseyNumber)) g.jerseyNumber = (g.jerseyNumber % 99) + 1;
        usedJerseys.add(g.jerseyNumber);
        team.players.push(g);
      }
    }
    assignLineupForTeam(team);
  }

  // Extraer listado completo de CARRERAS-UFRO
  let carrerasUfro = [];
  for (const tab of payload.carrerasTabs || []) {
    const rows = parseCsvText(tab.csv);
    for (let r = 0; r < rows.length; r += 1) {
      const val = String(rows[r][0] || '').trim();
      if (!val) continue;
      if (r === 0 && normalizeTextKey(val).includes('carrera')) continue;
      if (!carrerasUfro.includes(val)) carrerasUfro.push(val);
    }
  }
  if (carrerasUfro.length === 0) carrerasUfro = [...CARRERAS_UFRO];

  return {
    source: 'google_sheets_live',
    sheetUrl: payload.sheetUrl || DEFAULT_NOTFC_SHEET_URL,
    sheetError: '',
    carrerasUfro,
    teams: parsedTeams,
    freeAgents: freeAgents.length > 0 ? freeAgents : generateFreeAgentsPool(36, rng),
  };
}
