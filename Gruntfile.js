var spec = require('./lib/spec')
var prompt = require('prompt')
prompt.start()

var modPath = '../../server_mods/com.wondible.pa.land_war/'
var stream = 'stable'
var media = require('./lib/path').media(stream)

module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    copy: {
      mod: {
        files: [
          {
            src: [
              'modinfo.json',
              'LICENSE.txt',
              'README.md',
              'CHANGELOG.md',
              'ui/**',
              'pa/**'],
            dest: modPath,
          },
        ],
      },
    },
    clean: ['pa', modPath],
    // copy files from PA, transform, and put into mod
    proc: {
      unit_list: {
        src: [
          'pa_ex1/units/unit_list.json',
        ],
        cwd: media,
        dest: 'pa/units/unit_list.json',
        process: function(spec) {
          var judge = function(id) {
            if (id.match('/pa/units/air/base_flyer')) return true
            if (id.match('/pa/units/air/')) return false
            if (id.match('drone_carrier')) return false
            if (id.match('air_defense')) return false
            if (id.match('aa_missile')) return false
            if (id.match('tank_flak')) return false
            return true
          }
          var removedUnits = []
          spec.units = spec.units.filter(function(id) {
            var keep = judge(id)
            if (keep == false) {
              removedUnits.push({spec_id: id})
            }
            return keep
          })
          grunt.file.write('ui/mods/land_war/global.js',
            'if (HodgePodge) { HodgePodge.removeUnits(' +
            JSON.stringify(removedUnits, null, 2) + 
            ') }')
          return spec
        }
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerMultiTask('proc', 'Process unit files into the mod', function() {
    if (this.data.targets) {
      var specs = spec.copyPairs(grunt, this.data.targets, media)
      spec.copyUnitFiles(grunt, specs, this.data.process)
    } else {
      var specs = this.filesSrc.map(function(s) {return grunt.file.readJSON(media + s)})
      var out = this.data.process.apply(this, specs)
      grunt.file.write(this.data.dest, JSON.stringify(out, null, 2))
    }
  })

  // Default task(s).
  grunt.registerTask('default', ['proc', 'copy:mod']);

};

