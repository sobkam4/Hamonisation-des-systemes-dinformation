package com.ngtec.locationapp.data.repository

import com.ngtec.locationapp.data.local.dao.ClientDao
import com.ngtec.locationapp.data.mapper.toDomain
import com.ngtec.locationapp.data.mapper.toEntity
import com.ngtec.locationapp.data.remote.api.ClientApiService
import com.ngtec.locationapp.data.remote.dto.ClientCreateRequest
import com.ngtec.locationapp.domain.model.Client
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

@Singleton
class ClientRepository @Inject constructor(
    private val clientApiService: ClientApiService,
    private val clientDao: ClientDao
) {
    fun observeClients(): Flow<List<Client>> = clientDao.observeAll().map { items ->
        items.map { entity -> entity.toDomain() }
    }

    suspend fun refreshClients() {
        val remoteItems = clientApiService.getClients()
        clientDao.clearAll()
        clientDao.insertAll(remoteItems.map { dto -> dto.toEntity() })
    }

    suspend fun createClient(
        nom: String,
        prenom: String,
        telephone: String,
        email: String,
        adresse: String,
        pieceIdentite: String,
        numeroPieceIdentite: String? = null,
        notes: String? = null
    ): Client {
        val created = clientApiService.createClient(
            request = ClientCreateRequest(
                nom = nom,
                prenom = prenom,
                telephone = telephone,
                email = email,
                adresse = adresse,
                pieceIdentite = pieceIdentite,
                numeroPieceIdentite = numeroPieceIdentite,
                notes = notes
            )
        )
        val entity = created.toEntity()
        clientDao.insertAll(listOf(entity))
        return entity.toDomain()
    }

    suspend fun deleteClient(id: Long) {
        clientApiService.deleteClient(id)
        clientDao.deleteById(id)
    }
}
