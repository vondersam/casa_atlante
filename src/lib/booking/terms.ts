import { TERMS_VERSION, type Locale } from "./policy";

const houseTerms = {
  es: [
    "Tarifas: Las tarifas se calculan según el número de huéspedes y la duración de la estancia. El importe abonado cubre únicamente el alquiler del alojamiento para el número de huéspedes acordado y pagado. La ocupación no puede superar el número de huéspedes acordado. Los huéspedes no pueden invitar a familiares o amigos que no estén incluidos en la reserva.",
    "Limpieza y daños: La limpieza final y el cambio de ropa de cama, sábanas y toallas son gratuitos. Para estancias de más de 3 semanas, también se realizarán a mitad de la estancia. Se recomienda dejar la casa barrida, con los platos lavados y guardados, y retirar toda la basura y los materiales reciclables al hacer el check-out. Los huéspedes son responsables de los daños que se produzcan en el alojamiento durante su estancia. Si algo resulta dañado, el huésped se compromete a informar inmediatamente al propietario por escrito. Lo mismo se aplica a cualquier avería en la casa o en la propiedad.",
    "Disposiciones generales: El alojamiento dispone de jabón, papel higiénico, especias, sal y pimienta, aceite y vinagre, café y té. Estas provisiones no se reponen durante la estancia; los huéspedes deberán reponerlas si se agotan. La casa también dispone de ropa de cama 100% algodón, toallas, paños de cocina, tabla y plancha, secador de pelo y otros artículos. La cocina está totalmente equipada con cafetera, cafetera moka, hervidor de agua, tostadora y los electrodomésticos principales, incluida una lavadora. La casa también dispone de televisión por satélite, Internet wifi y otros elementos para la comodidad de los huéspedes.",
    "Condiciones generales e información",
    "• La hora de entrada es a las 15:00 y la hora de salida es a las 10:00.",
    "• No está permitido fumar en el interior.",
    "• Hay aparcamiento gratuito disponible en la propiedad.",
    "• Al salir de la casa, los huéspedes dejarán las llaves en la caja de llaves y cerrarán todas las puertas.",
    "• No se permiten mascotas ni alojarlas dentro de la vivienda vacacional.",
    "• El huésped reconoce que el inventario de la casa puede variar con el tiempo cuando el propietario retire artículos para repararlos o realice cambios decorativos.",
    "• Este contrato se rige por la legislación de las Islas Canarias y sustituye cualquier acuerdo verbal previo.",
    "• Los propietarios no son responsables del robo ni de los daños a los bienes personales de los huéspedes.",
    "• Si algún aparato o electrodoméstico deja de funcionar, el precio no se verá afectado. El propietario intentará solucionar el problema en un plazo razonable. El huésped se compromete a notificar inmediatamente al propietario o a su representante cualquier avería, daño o emergencia.",
    "• El propietario o una persona de reparación o mantenimiento podrá entrar en la propiedad para realizar servicios, reparaciones u otras tareas relacionadas con el alquiler, siempre avisando al huésped con una antelación razonable.",
    "• El huésped se compromete a actuar con prudencia respecto al ruido. La propiedad está sujeta a la normativa de ruido de El Paso y a la intervención de las autoridades. El propietario podrá resolver este contrato y desalojar al huésped si se producen quejas reiteradas de los vecinos o interviene la policía. El horario de silencio es de 23:00 a 08:00. Nunca se permite música alta en las terrazas ni en el jardín.",
    "• No se debe tirar al inodoro papel ni otros residuos, como compresas o pañales. Deben utilizarse las papeleras situadas junto al inodoro.",
    "• El agua del grifo no es potable, aunque puede utilizarse para cocinar. Para beber, recomendamos agua embotellada.",
    "• Si hace viento, y siempre al salir de la casa o por la noche, deben guardarse dentro todos los cojines y sombrillas de las terrazas.",
  ],
  en: [
    "Rates: The rates are calculated based on the number of guests and the length of stay. The amount paid by the guest covers the rent of the accommodation only for the number of guests agreed upon and paid for. The occupancy may not exceed the guest count agreed upon. Guests may not invite family members or friends to the premises that are not accounted for via the booking.",
    "Cleaning & Damages: The final cleaning and change of bedding, linens and towels are free of charge. For stays longer than 3 weeks, they will also be done during the mid-stay. It is recommended to leave the home broom clean, with dishes washed and put away and all trash and recyclables removed when checking out. Guests are held responsible for damage that occurs to the holiday home during their stay. If something gets damaged during the stay, the guest agrees to inform the owner immediately in writing. The same applies to any malfunction in the house or on the premises.",
    "General provisions: The accommodation is equipped with a supply of soap, toilet paper, spices, salt and pepper, oil and vinegar, coffee and tea. These supplies are not replenished during occupancy; guests are responsible for replenishing them should they run out. The home is also furnished with 100% cotton linens, towels, kitchen towels, an ironing board and iron, a hair dryer and other items. The kitchen is fully equipped with a coffee maker, mocha machine, hot water maker, toaster and all major appliances, including a washing machine. The home also has satellite TV, Wi-Fi Internet and other items for guests' comfort.",
    "General Terms and Disclosures:",
    "• Check-in time is 3 p.m. Check-out time is 10 a.m.",
    "• Smoking is not allowed indoors.",
    "• Parking is available at the property free of charge.",
    "• When leaving the house, guests will leave the keys in the key locker and close all doors.",
    "• No pets are allowed or may be harboured inside the vacation rental accommodation.",
    "• The guest acknowledges that the inventory of the house may vary and change over time as the owner removes items for repair or makes other decorative changes.",
    "• This agreement is based on Canary Islands law and supersedes all prior oral discussions.",
    "• The owners are not responsible for theft or any damage to guests' personal property.",
    "• Should any of the home's gadgets or appliances become inoperable, the rate will not be affected. The owner will attempt to correct the problem in a timely manner. The guest agrees to immediately notify the owner or their agent of any malfunction, damage or emergency.",
    "• The owner or a repair/service person may enter the property for service, repairs or another reason pertinent to the rental business only with reasonable notice to the guest.",
    "• The guest agrees to use good judgment regarding noise. The property is subject to the El Paso noise ordinance and law-enforcement involvement. The owner may terminate this agreement and evict the guest should repeated complaints from neighbours or police involvement occur. Quiet hours are from 11 p.m. to 8 a.m. Loud outdoor music on the terraces and in the garden is never allowed.",
    "• No paper or other waste, such as sanitary towels or nappies, should be deposited in the toilet. Please use the bins located next to the toilet.",
    "• The tap water is not drinkable, although it can be used for cooking. For drinking, bottled water is recommended.",
    "• Please put all pillows and parasols from the terraces inside if it gets windy, and always when leaving the house or at night.",
  ],
};

export function rentalTerms(locale: Locale): string[] {
  const payment =
    locale === "es"
      ? [
          "Contrato de alquiler vacacional - Casa Atlante. Versión " +
            TERMS_VERSION,
          "Dirección: Carretera General Jedey 42, 38759 El Paso, La Palma, España. Teléfono: +34 675103382.",
          "El pago íntegro confirma la reserva. Las solicitudes de transferencia no reservan fechas hasta su aprobación. Tras la aprobación, el plazo de pago es de 48 horas, salvo prórroga expresa.",
          "Cancelación por el huésped: reembolso del 100% hasta las 23:59 del día situado 14 días naturales antes de la entrada; 50% hasta las 23:59 del día situado 7 días naturales antes; 0% después. Todos los plazos se calculan en la zona Atlantic/Canary. Los porcentajes se aplican al total pagado, incluido IGIC, sin descontar comisiones.",
          "Si Casa Atlante cancela porque no puede alojar al huésped, se devuelve el 100%. Las instrucciones de acceso se envían por separado.",
        ]
      : [
          "Vacation rental agreement - Casa Atlante. Version " + TERMS_VERSION,
          "Address: Carretera General Jedey 42, 38759 El Paso, La Palma, Spain. Telephone: +34 675103382.",
          "Full payment confirms the booking. Bank-transfer requests do not reserve dates until approved. Payment is due 48 hours after approval unless expressly extended.",
          "Guest cancellation: 100% refund through 23:59 on the calendar date 14 days before check-in; 50% through 23:59 on the calendar date 7 days before check-in; 0% thereafter. All deadlines use Atlantic/Canary time. Percentages apply to the full amount paid, including IGIC, without fee deductions.",
          "If Casa Atlante cancels because it cannot accommodate the guest, the refund is 100%. Access instructions are sent separately.",
        ];
  return [...payment, ...houseTerms[locale]];
}
