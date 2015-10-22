define([
            'jquery',
            'chosen',
            'underscore',
            'backbone',
            'models/busRouteStops',
            'collections/busRouteStops',
            'text!templates/busRouteStops.html'], function($, chosen, _, Backbone, busRouteStopsModel, busRouteStopsCollection, routeStopsTemplate) {

            var stopsView = Backbone.View.extend({

                el: '.routeStops',

                 initialize: function () {
                    busRouteStopsCollection.fetch({
                        traditional: true,
                        data: {
                            'command': 'directionStops',
                            'agency': Backbone.app.defaults.agencyTag,
                            'route': Backbone.app.defaults.routeNumber,
                            'direction': Backbone.app.defaults.directionVar
                        }
                    });

                    this.listenTo( busRouteStopsCollection, 'sync', this.render );
                 },

                 render: function () {
                    var self = this;
                    var busRouteStops = {};
                    var busRouteStopModel = this.model;

                    if ( typeof busRouteStopModel === 'object' && busRouteStopModel.models[0] !== undefined ) {

                        busRouteStops = this.getBusRouteStops( busRouteStopModel );

                        this.$stop_select = $( '#stop_select' );

                        this.$stop_select.trigger( 'chosen:updated' );

                        if ( (Array.isArray( busRouteStops.stops )) && (busRouteStops.stops.length >= 1) ) {
                            this.$stop_select.find( 'option:gt(0)' ).remove();

                            busRouteStops = _.sortBy( busRouteStops.stops, 'title' );
                            busRouteStops = _.without( busRouteStops, 'undefined' );

                            var data = {
                                    'stopItems': busRouteStops
                            };

                            var stopsTemplate = _.template( routeStopsTemplate );
                            this.$stop_select.append( stopsTemplate(data) );                              

                            if ( !isNaN( Backbone.app.defaults.stopId ) ) {
                                this.$stop_select.val( Backbone.app.defaults.stopId );
                                
                                Backbone.app.defaults.stopId = this.$stop_select.find('option:selected').attr('data-stopId');
                                Backbone.app.defaults.stopTag = this.$stop_select.val();
                            }

                            $( '#stop_select' ).chosen( {
                                no_results_text: 'Nothing found.',
                                width: '60%'
                            } );

                            $( '.container main .content .routeInfo .routeStops' ).show();
                        }                    
                    }
                 },

                events: {
                    'change #stop_select': 'showArivalTime'
                },                 

                /**
                *
                * Function that returns a routes stops based on the direction selected.
                *
                **/ 
                getBusRouteStops: function ( obj ) {
                    var busRouteStopModel = obj.models[ 0 ].attributes;
                    var busStops = obj.pluck( 'routeStops' );
                    var busRouteStops = {
                        'stops': []
                    };

                    if ( typeof busRouteStopModel === 'object' ) {
                        //Create a new object that matches the stop tilte with the  stop info such as lat, lon etc.
                        var results = _.map( busRouteStopModel.directionStops.stop, function ( obj ) {
                            var key = '';
                            var res = {};
                            var result = {};
                            var tag = obj.attributes.tag;
                            tag = tag.replace( '_ar', '' );
                            //Get the stops
                            var res = _.pick( busStops[ 0 ], function ( val, k ) {
                                if ( val.attributes.tag === tag ) {
                                    var r = {};
                                    key = k;

                                    r = {
                                        'lat': val.attributes.lat,
                                        'lon': val.attributes.lon,
                                        'stopId': val.attributes.stopId,
                                        'tag': val.attributes.tag.replace( '_ar', '' ), //Some stops have _ar in the tag  so remove it if it exists.
                                        'title': val.attributes.title,
                                    };

                                    return r;
                                }
                            } );
                            //Return attributes to results object
                            if ( typeof res === 'object' ) {
                                if ( typeof res[ key ] === 'object' ) {
                                    if ( typeof res[ key ].attributes === 'object' ) {
                                        result = {
                                            'attributes': {
                                                'tag': ( typeof res[ key ].attributes.tag === 'string' ) ? res[ key ].attributes.tag : '',
                                                'title': ( typeof res[ key ].attributes.title === 'string' ) ? res[ key ].attributes.title : '',
                                                'lat': ( typeof res[ key ].attributes.lat === 'string' ) ? res[ key ].attributes.lat : '',
                                                'lon': ( typeof res[ key ].attributes.lon === 'string' ) ? res[ key ].attributes.lon : '',
                                                'stopId': ( typeof res[ key ].attributes.stopId === 'string' ) ? res[ key ].attributes.stopId : ''
                                            }
                                        };
                                    } //typeof res[key].attributes === 'object'
                                } else {
                                    //Return 'undefined' as a string for object if there are no attributes.
                                    result = 'undefined';
                                } //typeof res[key] === 'object'
                            } //typeof res === 'object'

                            return result;
                        } );

                        busRouteStops.stops = results;

                        return busRouteStops;
                    }
                },

                /**
                 *
                 * Function to show the bus arival time based on the stop selected.
                 *
                 **/
                showArivalTime: function ( e ) {
                    if ( this.$stop_select.val() ) {
                        Backbone.app.defaults.stopTag = this.$stop_select.val();
                        Backbone.app.defaults.stopId = this.$stop_select.find( 'option:selected' ).attr( 'data-stopId' );
                        Backbone.app.router.navigate( 'route/' + Backbone.app.defaults.routeNumber + '/' + 'direction' + '/' + encodeURIComponent( Backbone.app.defaults.directionVar ) + '/' + 'stop' + '/' + Backbone.app.defaults.stopTag, {
                            trigger: true
                        } );
                    }
                    return false;
                },         

                close: function () {
                    if ( this.$stop_select.length ) {
                        this.$stop_select.find( 'option:gt(0)' ).remove();
                    }

                    this.$el.hide();
                    this.$el.unbind();

                    Backbone.app.defaults.stopId = 0;
                    Backbone.app.defaults.stopTag = 0;          
                }       
            });

            return stopsView;
});
