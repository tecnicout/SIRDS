  const actualizarEmpleado = useCallback(async (empleadoData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Limpiar datos antes de enviar
      const cleanData = Object.fromEntries(
        Object.entries(empleadoData).map(([key, value]) => {
          // Manejar campo estado específicamente
          if (key === 'estado') {
            // Asegurar que estado sea número (1 o 0)
            return [key, parseInt(value, 10)];
          }
          // Para otros campos, convertir cadenas vacías a null
          return [key, value === '' ? null : value];
        })
      );
      
      const response = await fetch(`/api/empleados/${editingEmpleado.id_empleado}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanData)
      });

      const result = await response.json();

      if (response.ok) {
        showToast('✅ Empleado actualizado exitosamente', 'success');
        await cargarEmpleados(); // Recargar datos
        setShowEditModal(false);
        setEditingEmpleado(null);
      } else {
        // Manejo específico de errores de validación
        if (result.message?.includes('identificación')) {
          showToast('❌ Ya existe otro empleado con esta identificación', 'error');
        } else if (result.message?.includes('email')) {
          showToast('❌ Ya existe otro empleado con este email', 'error');
        } else if (result.message?.includes('género') || result.message?.includes('área')) {
          showToast('❌ Género o área especificado no válido', 'error');
        } else {
          showToast(`❌ ${result.message || 'Error al actualizar empleado'}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      showToast('❌ Error de conexión al actualizar empleado', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingEmpleado, cargarEmpleados]);