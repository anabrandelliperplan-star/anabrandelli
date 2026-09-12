import { NextResponse } from "next/server";
import { getData, saveData } from "@/lib/db";
import type { Development } from "@/lib/types";

export async function POST() {
  const data = await getData();
  const id = "novo-" + Date.now();
  const dev: Development = {
    id,
    name: "Novo empreendimento",
    location: "Ribeirão Preto · SP",
    typology: "",
    status: "progress",
    statusDetail: "",
    priceFrom: 0,
    unidadesDisponiveis: "",
    driveLink: "",
    tabelaLink: "",
    bookLink: "",
    mapsLink: "",
    materialDescritivoLink: "",
    vagasGaragemLink: "",
    vagasIndeterminadas: false,
    temDecorado: true,
    premiacao: "",
    descricao: "",
    fluxoPagamento: "",
    photos: [],
    typologies: [],
    hidden: false,
    simAtoMes: "",
    simSinal1Mes: "",
    simSinal2Mes: "",
    simSinal3Mes: "",
    simMesesObra: 0,
    tabelaUnidades: [],
  };
  data.developments.push(dev);
  await saveData(data);
  return NextResponse.json(dev, { status: 201 });
}
